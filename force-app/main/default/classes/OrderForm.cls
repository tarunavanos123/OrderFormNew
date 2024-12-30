public with sharing class OrderForm {


    @AuraEnabled(cacheable=true)
    public static List<Product2> fetchProduct() {
        return [SELECT Id, Name FROM Product2 LIMIT 10];
    }

    @AuraEnabled
    public static void submitOrderForm(String orderFormId) {

        if (orderFormId != '') {
            Id orderId = Id.valueOf(orderFormId);
            List<Order_Form__c> orderFormList = [Select id from Order_Form__c where id=: orderId];
            for(Order_Form__c ord : orderFormList) {
                ord.isSubmitted__c = true;
            }
            update orderFormList;
        }
    }

    @AuraEnabled
    public static Id updateOrderRecord(String customerData, Boolean isOrderAlreadyCreated) {

        // Validate inputs
        if (true) {
            //throw new IllegalArgumentException('AccountId and AccountType must not be null or blank.');
            Map<String, Object> customerInformation = (Map<String, Object>) JSON.deserializeUntyped(customerData);

            String customerType = (String) customerInformation.get('customerType');

            String customerId = (String) customerInformation.get('customerId');

            Id recordId = null;
            if (customerId != 'null' || customerId == null) {
                recordId = Id.valueOf(customerId);

            }
            String orderFormValue = (String) customerInformation.get('orderFormId');

            Id orderFormId = null;
            if (orderFormValue != null) {
                orderFormId = Id.valueOf(orderFormValue);
            }

            Map<String, Object> customerDetails = (Map<String, Object>) customerInformation.get('CustomerData');
            Map<String, Object> ShippingAddress = (Map<String, Object>) customerDetails.get('ShippingAddress');
            Map<String, Object> BillingAddress = (Map<String, Object>) customerDetails.get('BillingAddress');

            String CustomerTradeClass = (String) customerDetails.get('CustomerTradeClass');
            String po = (String) customerDetails.get('PO');
            String companyName = (String) customerDetails.get('CompanyName');
            Boolean WithoutRx = (Boolean) customerDetails.get('WithoutRx');
            String Salutation = (String) customerDetails.get('Salutation');
            String FirstName = (String) customerDetails.get('FirstName');
            String LastName = (String) customerDetails.get('LastName');
            String Email = (String) customerDetails.get('Email');
            String Phone = (String) customerDetails.get('Phone');
            String Fax = (String) customerDetails.get('Fax');
            String state = (String) ShippingAddress.get('State');
            String Street = (String) ShippingAddress.get('Street');
            String ZipCode = (String) ShippingAddress.get('ZipCode');
            String City = (String) ShippingAddress.get('City');

            String BillingState = (String) BillingAddress.get('State');
            String BillingStreet = (String) BillingAddress.get('Street');
            String BillingZipCode = (String) BillingAddress.get('ZipCode');
            String BillingCity = (String) BillingAddress.get('City');

            if (!isOrderAlreadyCreated) {
                Order_Form__c orderFormRecord = new Order_Form__c();
                if (recordId != null) {
                    orderFormRecord.SAP_Account__c = recordId;
                }

                orderFormRecord.Customer_Type__c = customerType;
                orderFormRecord.Customer_Trade_Class__c = CustomerTradeClass;
                orderFormRecord.PO__c = po;
                orderFormRecord.Company_Name__c = companyName;
                orderFormRecord.Without_Rx__c = WithoutRx;
                orderFormRecord.Salutation__c = Salutation;
                orderFormRecord.First_Name__c = FirstName;
                orderFormRecord.Last_Name__c = LastName;
                orderFormRecord.Email__c = Email;
                orderFormRecord.Phone__c = Phone;
                orderFormRecord.Fax__c = Fax;
                orderFormRecord.Shipping_State__c = state;
                orderFormRecord.Shipping_Street__c = Street;
                orderFormRecord.Shipping_Zip_Postal_Code__c = ZipCode;
                orderFormRecord.Shipping_City__c = City;
                orderFormRecord.Billing_State__c = BillingState;
                orderFormRecord.Billing_Street__c = BillingStreet;
                orderFormRecord.Billing_Zip_Postal_Code__c = BillingZipCode;
                orderFormRecord.Billing_City__c = BillingCity;

                try {
                    insert orderFormRecord;
                } catch (DmlException ex) {
                    system.debug(ex);
                }
                return orderFormRecord.id;

            } else {

                List<Order_Form__c> orderForm = [Select SAP_Account__c, Customer_Type__c, Customer_Trade_Class__c, PO__c, Company_Name__c,
                Without_Rx__c, Salutation__c, First_Name__c, Last_Name__c, Email__c, Phone__c, Fax__c, Shipping_State__c,
                Shipping_Street__c,  Shipping_Zip_Postal_Code__c, Shipping_City__c , Billing_State__c,Billing_Street__c, Billing_Zip_Postal_Code__c,Billing_City__c from Order_Form__c   where id =: orderFormId];

                orderForm[0].SAP_Account__c = recordId;
                orderForm[0].Customer_Type__c = customerType;
                orderForm[0].Customer_Trade_Class__c = CustomerTradeClass;
                orderForm[0].PO__c = po;
                orderForm[0].Company_Name__c = companyName;
                orderForm[0].Without_Rx__c = WithoutRx;
                orderForm[0].Salutation__c = Salutation;
                orderForm[0].First_Name__c = FirstName;
                orderForm[0].Last_Name__c = LastName;
                orderForm[0].Email__c = Email;
                orderForm[0].Phone__c = Phone;
                orderForm[0].Fax__c = Fax;
                orderForm[0].Shipping_State__c = state;
                orderForm[0].Shipping_Street__c = Street;
                orderForm[0].Shipping_Zip_Postal_Code__c = ZipCode;
                orderForm[0].Shipping_City__c = City;
                orderForm[0].Billing_State__c = BillingState;
                orderForm[0].Billing_Street__c = BillingStreet;
                orderForm[0].Billing_Zip_Postal_Code__c = BillingZipCode;
                orderForm[0].Billing_City__c = BillingCity;
                try {
                    update orderForm;
                } catch (DmlException ex) {
                }

                return orderForm[0].id;

            }
        }

        return '';
    }

    @AuraEnabled
    public static void updateProductInfo(String productDetails, String orderFormId) {

        Id recordId = Id.valueOf(orderFormId);
        List<order_form_product__c> productRecordList = new List<order_form_product__c>();
        Set<ID> ExistingproductIds = new Set<ID>();
        Map<Id, Integer> productData = new Map<Id, Integer>();

        List<order_form_product__c> existingProductRecords = [Select Product__c, Quantity__c from order_form_product__c where Order_Form__c =: orderFormId];

        List<ProductWrapper> products = (List<ProductWrapper>) JSON.deserialize(productDetails, List<ProductWrapper>.class);

        for (ProductWrapper prod : products) {
            productData.put(prod.product_id, prod.quantity);

        }

        List<order_form_product__c> productsToDelete = new List<order_form_product__c>();

        for (order_form_product__c prod : existingProductRecords) {
            ExistingproductIds.add(prod.Product__c);
            if (productData.containsKey(prod.Product__c) && prod.Quantity__c != productData.get(prod.Product__c) ) {
                prod.Quantity__c = productData.get(prod.Product__c);
            }

            if (!productData.containsKey(prod.Product__c)) {
                productsToDelete.add(prod);
            }
        }

        update existingProductRecords;
        delete productsToDelete;

        for(ProductWrapper prod : products){
            if (!ExistingproductIds.contains(prod.product_id)) {
                order_form_product__c newProductRecord = new order_form_product__c();
                newProductRecord.Product__c = prod.product_id;
                newProductRecord.Quantity__c = prod.quantity;
                newProductRecord.Subtotal_Price__c = prod.subtotal;
                newProductRecord.Actual_Price__c = prod.actualPrice;
                newProductRecord.Discount_Price__c = prod.discountPrice;
                newProductRecord.Order_Form__c = recordId;
                productRecordList.add(newProductRecord);
            }
        }

        try {
            if(productRecordList.size()>0){
                insert productRecordList;

            }
        } catch (DmlException ex) {
            System.debug(ex);
        }
}

    public class ProductWrapper {
        public String index;
		public String product_id;
		public String productName;
		public Integer quantity;
		public Integer subtotal;
		public Integer actualPrice;
		public Integer discountPrice;
    }
}