#!/usr/bin/env python3
"""Import selected, rights-reviewed local photos. No network access or dataset scraping."""
import argparse
import csv
import hashlib
import os
from pathlib import Path
import re
import tempfile
from urllib.parse import urlsplit

FIELDS = ['food_name', 'title', 'file', 'author', 'source_url', 'license', 'license_url', 'provider', 'reviewed']
KOGL = 'https://www.kogl.or.kr/info/licenseType1.do'

def license_name(url):
    if url.rstrip('/') == 'https://creativecommons.org/publicdomain/zero/1.0':
        return 'CC0'
    match = re.fullmatch(r'https://creativecommons\.org/licenses/(by|by-sa)/(1\.0|2\.0|2\.5|3\.0|4\.0)/?', url)
    if match:
        return ('CC BY ' if match[1] == 'by' else 'CC BY-SA ') + match[2]
    if url == KOGL:
        return '공공누리 제1유형'
    return None

def source_url(value):
    uri = urlsplit(value)
    return uri.scheme == 'https' and uri.hostname and not uri.username and not uri.password and uri.port in (None, 443)

def import_photos(manifest, image_root, project):
    project, image_root = project.resolve(), image_root.resolve()
    if not (project / 'build.gradle').is_file():
        raise ValueError('프로젝트 루트에 build.gradle이 없습니다.')
    catalogue = project / 'src/main/resources/photo-catalog.tsv'
    images = project / 'src/main/resources/static/photos/catalog'
    planned = {}
    with manifest.open(encoding='utf-8-sig', newline='') as stream:
        reader = csv.DictReader(stream)
        if reader.fieldnames != FIELDS:
            raise ValueError('CSV 헤더가 예시와 다릅니다.')
        for row in reader:
            if len(planned) >= 10000:
                raise ValueError('한 번에 10000개까지만 등록합니다.')
            if row['reviewed'].strip().lower() != 'yes':
                raise ValueError('사진 일치·이용 조건 확인 후 reviewed에 yes를 입력하세요.')
            for key, limit in [('food_name', 100), ('title', 300), ('author', 200), ('provider', 200), ('source_url', 1000), ('license_url', 300), ('license', 80)]:
                value = row[key].strip()
                if not value or len(value) > limit or any(ord(c) < 32 for c in value):
                    raise ValueError('비어 있거나 올바르지 않은 필드: ' + key)
                row[key] = value
            if not source_url(row['source_url']) or license_name(row['license_url']) != row['license']:
                raise ValueError('출처 URL 또는 허용 라이선스를 확인하세요.')
            path = (image_root / row['file']).resolve()
            if not path.is_relative_to(image_root) or not path.is_file():
                raise ValueError('사진은 지정한 이미지 폴더 안에 있어야 합니다.')
            if path.stat().st_size > 20_000_000:
                raise ValueError('사진 한 장은 20MB 이하여야 합니다.')
            data = path.read_bytes()
            if data.startswith(b'\xff\xd8\xff'): ext = 'jpg'
            elif data.startswith(b'\x89PNG\r\n\x1a\n'): ext = 'png'
            elif data.startswith(b'RIFF') and data[8:12] == b'WEBP': ext = 'webp'
            else: raise ValueError('JPEG/PNG/WebP 원본만 등록할 수 있습니다.')
            name = hashlib.sha256(data).hexdigest() + '.' + ext
            fields = [row['food_name'], row['title'], '/photos/catalog/' + name, row['author'], row['source_url'], row['license'], row['license_url'], row['provider']]
            planned[row['food_name']] = (name, data, fields)
    existing = {}
    if catalogue.exists():
        for line in catalogue.read_text(encoding='utf-8').splitlines():
            if line and not line.startswith('#'):
                fields = line.split('\t')
                if len(fields) != 8: raise ValueError('기존 photo-catalog.tsv 형식을 확인하세요.')
                existing[fields[0]] = fields
    for food_name, (_, _, fields) in planned.items():
        existing[food_name] = fields
    if len(existing) > 10000: raise ValueError('등록 사진 목록은 10000개 이하여야 합니다.')
    images.mkdir(parents=True, exist_ok=True)
    # All rows validated before any write. Content-addressed assets never overwrite different bytes.
    for name, data, _ in planned.values():
        target = images / name
        if not target.exists(): target.write_bytes(data)
    with tempfile.NamedTemporaryFile('w', encoding='utf-8', dir=catalogue.parent, delete=False, newline='\n') as out:
        out.write('# food_name\ttitle\timage\tauthor\tsource\tlicense\tlicense_url\tprovider\n')
        for fields in existing.values(): out.write('\t'.join(fields) + '\n')
        temp = out.name
    os.replace(temp, catalogue)
    print(f'사진 {len(planned)}개 등록 · 전체 {len(existing)}개. 서버를 다시 시작하세요.')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest', required=True, type=Path)
    parser.add_argument('--image-root', required=True, type=Path)
    parser.add_argument('--project', default=Path('.'), type=Path)
    args = parser.parse_args()
    try: import_photos(args.manifest, args.image_root, args.project)
    except (ValueError, OSError) as error: parser.exit(1, str(error) + '\n')
