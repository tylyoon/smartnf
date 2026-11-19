import base64
from decimal import Decimal
from io import BytesIO
import unittest
from test_business_trade import TradeFlow
from openpyxl import load_workbook


class UpdateTests(unittest.TestCase):
    def setUp(self):
        self.flow=TradeFlow(methodName='test_purchase_to_settlement');self.flow.setUp()
        self.addCleanup(self.flow.doCleanups)

    def test_requote_preserves_history_and_invalidates_previous_offer(self):
        f=self.flow
        request=f.buy('rfq',seller=f.seller,name='양송이',spec='1kg 포장',unit='g',qty=2000,delivery='2090-01-01')['id']
        old=f.sell('quoteRfq',rfq=request,sku=f.sku,price=3000,until='2090-01-01')['id']
        negotiation=f.buy('priceRequest',quote=old,price=2800,reason='예산 조정')['id']
        new=f.sell('reviseQuote',quote=old,price=2800,until='2090-01-01')['id']
        offers={q['id']:q for q in f.buy('dashboard')['견적']}
        self.assertEqual((offers[old]['price'],offers[old]['quoteState']),(3000,'SUPERSEDED'))
        self.assertEqual((offers[new]['price'],offers[new]['version']),(2800,2))
        self.assertEqual(f.buy('dashboard')['가격협의'][0]['state'],'RESPONDED')
        with self.assertRaises(ValueError):f.buy('order',sku=f.sku,packs=2,quote=old)
        f.buy('order',sku=f.sku,packs=2,quote=new,delivery='2090-01-01')
        self.assertEqual(f.buy('dashboard')['거래'][0]['price'],2800)
        with self.assertRaises(ValueError):f.sell('reviseQuote',quote=new,price=2700,until='2090-01-01')

    def test_budget_is_period_wide_and_excel_contains_numeric_columns(self):
        f=self.flow
        f.buy('budget',start='2000-01-01',end='2099-12-31',amount=30000)
        oid=f.paid_order()
        f.sell('ship',id=oid)
        shipment=f.buy('dashboard')['출고'][0]['id']
        f.buy('receive',id=oid,shipment=shipment,place=f.dest,qty=2000)
        second=f.sell('catalog',name='=표시문자',origin='국내',unit='g',pack=100,price=3000,allergens='미확인',protein=0,sodium=0)['id']
        f.buy('order',sku=second,packs=2)
        report=f.buy('report',start='2000-01-01',end='2099-12-31',side='BUY',sku=second)
        self.assertEqual(report['예산']['전체 검수 기준 구매지출'],18000)
        self.assertEqual(report['예산']['예산 잔액'],12000)
        self.assertEqual(report['집계'][0]['주문금액'],6000)
        export=f.buy('reportExcel',start='2000-01-01',end='2099-12-31',side='BUY',sku=second)
        book=load_workbook(BytesIO(base64.b64decode(export['content'])))
        sheet=book['거래 상세']
        columns={cell.value:i+1 for i,cell in enumerate(sheet[1])}
        self.assertEqual(sheet.cell(2,columns['주문금액']).value,6000)
        self.assertEqual(sheet.cell(2,columns['상품']).data_type,'s')
        self.assertEqual(sheet.cell(2,columns['상품']).value,'=표시문자')
        self.assertEqual(sheet.freeze_panes,'A2')


if __name__=='__main__':
    unittest.main()
