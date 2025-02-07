public with sharing class OrderForm {

    @AuraEnabled(cacheable=true)
    public static List<OrderFormWrapper> getOrderFormsByOwner(String ownID) {
       Id ownerId= Id.valueOf(ownID);        // Query Order Form records for the specified owner
        List<Order_Form__c> orderForms = [
            SELECT 
                Id, 
                First_Name__c, 
                Last_Name__c,
                Email__c, 
                Phone__c,
                Company_Name__c,
                Status__c,
                (SELECT 
                    Id, 
                    Product__c, 
                    Quantity__c, 
                    Subtotal_Price__c, 
                    Actual_Price__c, 
                    Discount_Price__c 
                 FROM 
                    Order_Form_Products__r) // Child relationship name for Order_Form_Product__c
            FROM 
                Order_Form__c 
            WHERE 
                OwnerId = :ownerId
        ];

        System.debug('ORDER '+orderForms);

        // Map the queried records to a wrapper class
        List<OrderFormWrapper> orderFormWrappers = new List<OrderFormWrapper>();
        for (Order_Form__c orderForm : orderForms) {
            OrderFormWrapper wrapper = new OrderFormWrapper();
            wrapper.orderId = orderForm.Id;
            wrapper.firstName = orderForm.First_Name__c;
            wrapper.lastName = orderForm.Last_Name__c;
            wrapper.emailId = orderForm.Email__c;
            wrapper.phone = orderForm.Phone__c;
            wrapper.companyName = orderForm.Company_Name__c;
            wrapper.status = orderForm.Status__c;
            
            // Add product details
            wrapper.products = new List<OrderProductWrapper>();
            for (Order_Form_Product__c product : orderForm.Order_Form_Products__r) {
                OrderProductWrapper productWrapper = new OrderProductWrapper();
                productWrapper.productId = product.Product__c;
                productWrapper.quantity = product.Quantity__c;
                productWrapper.subtotalPrice = product.Subtotal_Price__c;
                productWrapper.actualPrice = product.Actual_Price__c;
                productWrapper.discountPrice = product.Discount_Price__c;
                wrapper.products.add(productWrapper);
            }

            orderFormWrappers.add(wrapper);
        }

        System.debug('ORDER -1'+orderFormWrappers);


        return orderFormWrappers;
    }

    @AuraEnabled(cacheable=true)
    public static List<orderFormIDWrappers> getOrderForms(String ownID) {
       Id ownerId= Id.valueOf(ownID);        // Query Order Form records for the specified owner
        List<Order_Form__c> orderForms = [
            SELECT
                Id,
                First_Name__c,
                Last_Name__c,
                Email__c,
                Phone__c,
                Company_Name__c,
                Status__c,
                Billing_City__c,
                Billing_Country__c,
                Billing_State__c,
                Billing_Street__c,
                Billing_Zip_Postal_Code__c,
                Comments__c,
                Without_Rx__c,
                Shipping_Zip_Postal_Code__c,
                Shipping_Street__c,
                Shipping_State__c,
                Shipping_Country__c,
                Shipping_City__c,
                Salutation__c,
                PO__c,
                Fax__c,
                (SELECT
                    Id,
                    Product__c,
                    Product__r.name,
                    Quantity__c,
                    Subtotal_Price__c,
                    Actual_Price__c,
                    Discount_Price__c
                FROM
                    Order_Form_Products__r) // Child relationship name for Order_Form_Product__c
            FROM
                Order_Form__c
            WHERE
                id = :ownerId
        ];

        System.debug('ORDER'+orderForms);

        // Map the queried records to a wrapper class
        List<orderFormIDWrappers> orderFormIDWrappers = new List<orderFormIDWrappers>();
        for (Order_Form__c orderForm : orderForms) {
            orderFormIDWrappers wrapper = new orderFormIDWrappers();
            wrapper.orderId = orderForm.Id;
            wrapper.firstName = orderForm.First_Name__c;
            wrapper.lastName = orderForm.Last_Name__c;
            wrapper.emailId = orderForm.Email__c;
            wrapper.phone = orderForm.Phone__c;
            wrapper.companyName = orderForm.Company_Name__c;
            wrapper.billingCity = orderForm.Billing_City__c;
            wrapper.billingCountry = orderForm.Billing_Country__c;
            wrapper.billingState = orderForm.Billing_State__c;
            wrapper.billingStreet = orderForm.Billing_Street__c;
            wrapper.billingZipCode = orderForm.Billing_Zip_Postal_Code__c;
            wrapper.comments = orderForm.Comments__c;
            wrapper.withoutRX = orderForm.Without_Rx__c;
            wrapper.shippingZipCode = orderForm.Shipping_Zip_Postal_Code__c;
            wrapper.shippingStreet = orderForm.Shipping_Street__c;
            wrapper.shippingState = orderForm.Shipping_State__c;
            wrapper.shippingCountry = orderForm.Shipping_Country__c;
            wrapper.shippingCity = orderForm.Shipping_City__c;
            wrapper.salutation = orderForm.Salutation__c;
            wrapper.PO = orderForm.PO__c;
            wrapper.fax = orderForm.Fax__c;
            
            // Add product details
            wrapper.products = new List<OrderProductWrapper>();
            for (Order_Form_Product__c product : orderForm.Order_Form_Products__r) {
                OrderProductWrapper productWrapper = new OrderProductWrapper();
                productWrapper.productId = product.Product__c;
                productWrapper.name = product.Product__r.Name;
                productWrapper.quantity = product.Quantity__c;
                productWrapper.subtotalPrice = product.Subtotal_Price__c;
                productWrapper.actualPrice = product.Actual_Price__c;
                productWrapper.discountPrice = product.Discount_Price__c;
                wrapper.products.add(productWrapper);
            }

            orderFormIDWrappers.add(wrapper);
        }

        System.debug('ORDER -1'+orderFormIDWrappers);


        return orderFormIDWrappers;
    }

    // Wrapper class to hold Order Form data
    public class OrderFormWrapper {
        @AuraEnabled public String orderId { get; set; }
        @AuraEnabled public String firstName { get; set; }
        @AuraEnabled public String lastName { get; set; }
        @AuraEnabled public String emailId { get; set; }
        @AuraEnabled public String phone { get; set; }
        @AuraEnabled public String companyName { get; set; }
        @AuraEnabled public String status { get; set; }
        @AuraEnabled public Decimal totalAmount { get; set; }
        @AuraEnabled public List<OrderProductWrapper> products { get; set; } // List of products

    }

    public class orderFormIDWrappers {
        @AuraEnabled public Id orderId { get; set; }
        @AuraEnabled public String firstName { get; set; }
        @AuraEnabled public String lastName { get; set; }
        @AuraEnabled public String emailId { get; set; }
        @AuraEnabled public String phone { get; set; }
        @AuraEnabled public String companyName { get; set; }
        @AuraEnabled public String billingCity { get; set; }
        @AuraEnabled public String billingCountry { get; set; }
        @AuraEnabled public String billingState { get; set; }
        @AuraEnabled public String billingStreet { get; set; }
        @AuraEnabled public String billingZipCode { get; set; }
        @AuraEnabled public String comments { get; set; }
        @AuraEnabled public Boolean withoutRX { get; set; }
        @AuraEnabled public String shippingZipCode { get; set; }
        @AuraEnabled public String shippingStreet { get; set; }
        @AuraEnabled public String shippingState { get; set; }
        @AuraEnabled public String shippingCountry { get; set; }
        @AuraEnabled public String shippingCity { get; set; }
        @AuraEnabled public String salutation { get; set; }
        @AuraEnabled public String PO { get; set; }
        @AuraEnabled public String fax { get; set; }
        @AuraEnabled public List<OrderProductWrapper> products { get; set; } // List of products

    }
   // Wrapper class to hold Product details
   public class OrderProductWrapper {
    @AuraEnabled public String productId { get; set; }
    @AuraEnabled public String Name { get; set; }
    @AuraEnabled public Decimal quantity { get; set; }
    @AuraEnabled public Decimal subtotalPrice { get; set; }
    @AuraEnabled public Decimal actualPrice { get; set; }
    @AuraEnabled public Decimal discountPrice { get; set; }
}


    @AuraEnabled(cacheable=true)
    public static List<Product2> fetchProduct() {
        return [SELECT Id, Name,SBQQ__ConfigurationType__c FROM Product2 Where name like '%product%' ];
    }

    @AuraEnabled
    public static List<SBQQ__ProductOption__c> fetchProductOptions(Id productId) {
        system.debug('productId' +  productId);
        List<SBQQ__ProductOption__c> listName = [SELECT Id, Name, SBQQ__ConfiguredSKU__c FROM SBQQ__ProductOption__c WHERE SBQQ__ConfiguredSKU__c = :productId];
        system.debug('productId' +  listName);

        return [SELECT Id, Name, SBQQ__OptionalSKU__c, SBQQ__ConfiguredSKU__c, SBQQ__Required__c, SBQQ__Selected__c FROM SBQQ__ProductOption__c WHERE SBQQ__ConfiguredSKU__c = :productId];
    }

    @AuraEnabled
    public static List<SBQQ__ProductOption__c> fetchSecondLevelProductOptions(Id productId) {
        system.debug('productId2' +  productId);
        List<SBQQ__ProductOption__c> listName = [SELECT Id, Name, SBQQ__ConfiguredSKU__c, SBQQ__OptionalSKU__c FROM SBQQ__ProductOption__c WHERE id = :productId];
        system.debug('productId1' +  listName[0].SBQQ__OptionalSKU__c);

        return [SELECT Id, Name, SBQQ__OptionalSKU__c, SBQQ__ConfiguredSKU__c, SBQQ__Required__c, SBQQ__Selected__c FROM SBQQ__ProductOption__c WHERE SBQQ__ConfiguredSKU__c = :listName[0].SBQQ__OptionalSKU__c];
    }
    
    @AuraEnabled
    public static String submitOrderForm(String orderFormId) {

        Integer keySize = 256;
        Blob privateKey = Crypto.generateAesKey(keySize);
        String Value =  EncodingUtil.Base64Encode(privateKey);
        System.debug('key ' + Value);
        if (orderFormId != '') {
            
            Id orderId = Id.valueOf(orderFormId);
            List<Order_Form__c> orderFormList = [Select id from Order_Form__c where id=: orderId];
            for(Order_Form__c ord : orderFormList) {
                ord.isSubmitted__c = true;
                ord.token__c = Value;
            }
            update orderFormList;

        }
        return Value;
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
            System.debug('BillingAddress ' + BillingAddress);
            System.debug('ShippingAddress ' + ShippingAddress);


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
            String state = (String) ShippingAddress.get('shippingState');
            String Street = (String) ShippingAddress.get('shippingStreet');
            String ZipCode = (String) ShippingAddress.get('shippingZipCode');
            String City = (String) ShippingAddress.get('shippingCity');

            system.debug('sbilli' + Street + '' + state + '' + ZipCode);


            String BillingState = (String) BillingAddress.get('billingState');
            String BillingStreet = (String) BillingAddress.get('billingStreet');
            String BillingZipCode = (String) BillingAddress.get('billingZipCode');
            String BillingCity = (String) BillingAddress.get('billingCity');

            system.debug('billi' + BillingState + '' + BillingStreet + '' + BillingZipCode);

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

                System.debug('orderFormRecord' + orderFormRecord);

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

                System.debug('orderForm' + orderForm);

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
    public static void updateProductOption(String productDetails, String orderFormId) {
        Id recordId = Id.valueOf(orderFormId);

        Set<ID> ExistingproductIds = new Set<ID>();
        Map<String, Boolean> productData = new Map<String, Boolean>();

        List<order_form_product__c> existingProductRecords = [Select Product__c from order_form_product__c where Order_Form__c =: orderFormId];



        List<ProductWrapperOption> products = (List<ProductWrapperOption>) JSON.deserialize(productDetails, List<ProductWrapperOption>.class);

        for (ProductWrapperOption prod : products) {
            productData.put(prod.sku, prod.selected);

        }

        System.debug('productData ' + productData);

        List<order_form_product__c> productsToDelete = new List<order_form_product__c>();


        for (order_form_product__c prod : existingProductRecords) {
            ExistingproductIds.add(prod.Product__c);
            if (productData.containsKey(prod.Product__c) && productData.get(prod.Product__c) == false) {
                productsToDelete.add(prod);
            }
        }

        System.debug('ExistingproductIds ' + ExistingproductIds);
        System.debug('productsToDelete ' + productsToDelete);


        try {
            if(productsToDelete.size()>0){
                Database.DeleteResult[] deleteResults = Database.delete(productsToDelete, false);

                for (Database.DeleteResult result : deleteResults) {
                    if (!result.isSuccess()) {
                        for (Database.Error error : result.getErrors()) {
                            System.debug('Error deleting record: ' + error.getMessage());
                        }
                    }
                }

                // delete productsToDelete;

            }
            
        } catch (DmlException ex) {
            System.debug(ex);
        }



        List<order_form_product__c> productRecordList = new List<order_form_product__c>();

        for(ProductWrapperOption prod : products){
            order_form_product__c newProductRecord = new order_form_product__c();
            System.debug('sku ' + prod.sku);
            System.debug('selected ' + prod.selected);
            System.debug('ExistingproductIds ' + ExistingproductIds.contains(prod.sku));


            if (prod.sku != '' && prod.selected && !ExistingproductIds.contains(prod.sku)) {
                System.debug('inside..');
                newProductRecord.Product__c = prod.sku;
                newProductRecord.Order_Form__c = recordId;
                productRecordList.add(newProductRecord);
            }
            
        }

        system.debug('productsOption ' + products);
        system.debug('productRecordList ' + productRecordList);


        try {
            if(productRecordList.size()>0){
                System.debug('productRecordListif..' + productRecordList);
                insert productRecordList;
        List<order_form_product__c> existingProductRecords1 = [Select Product__c from order_form_product__c where Order_Form__c =: orderFormId];
        System.debug('array..' + existingProductRecords1);



            }
        } catch (DmlException ex) {
            System.debug(ex);
        }
    }

    @AuraEnabled
    public static void updateProductInfo(String productDetails, String orderFormId) {

        System.debug('updateProductInfo');

        Id recordId = Id.valueOf(orderFormId);
        List<order_form_product__c> productRecordList = new List<order_form_product__c>();
        Set<ID> ExistingproductIds = new Set<ID>();
        Map<Id, Integer> productData = new Map<Id, Integer>();

        List<order_form_product__c> existingProductRecords = [Select Product__c, Quantity__c from order_form_product__c where Order_Form__c =: orderFormId AND isMasterProduct__c = true];
        System.debug('productDetails' + productDetails);
        List<ProductWrapper> products = (List<ProductWrapper>) JSON.deserialize(productDetails, List<ProductWrapper>.class);

        for (ProductWrapper prod : products) {
            productData.put(prod.product_id, prod.quantity);

        }
        System.debug('productDetails1' + products);

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

        if (existingProductRecords.size() > 0) {
            update existingProductRecords;
        }

        if (productsToDelete.size() > 0) {
            delete productsToDelete;
        }

        for(ProductWrapper prod : products){
            if (!ExistingproductIds.contains(prod.product_id)) {
                order_form_product__c newProductRecord = new order_form_product__c();
                newProductRecord.Product__c = prod.product_id;
                newProductRecord.Quantity__c = prod.quantity;
                newProductRecord.Subtotal_Price__c = prod.subtotal;
                newProductRecord.Actual_Price__c = prod.actualPrice;
                newProductRecord.Discount_Price__c = prod.discountPrice;
                newProductRecord.Order_Form__c = recordId;
                newProductRecord.isMasterProduct__c = true;
                productRecordList.add(newProductRecord);
            }
        }

        try {
            if(productRecordList.size()>0){
                System.debug('productRecordList' + productRecordList);
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

    public class ProductWrapperOption {
		public String sku;
		public String id;
		public String name;
        public Boolean selected;
    }

    @AuraEnabled(cacheable=true)
    public static List<Product2> searchProducts(String searchTerm) {
        String query = 'SELECT Id, Name,SBQQ__ConfigurationType__c FROM Product2 Where Name like:searchTerm limit 10';
        List<String> conditions = new List<String>();

        return Database.query(query);
    }
}