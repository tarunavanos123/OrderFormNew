public without sharing class AccountRecordPicker {
    @AuraEnabled
    public static List<SAP_Account__c> searchAccounts(String searchTerm) {
        String query = 'SELECT Id, Name, Phone__c, First_Name__c, Last_Name__c, SAP_Account_Number__c, Shipping_Street__c, Billing_Street__c  FROM Order_Form__c WHERE ';

        List<String> conditions = new List<String>();

        if (!String.isEmpty(searchTerm)) {
            conditions.add('Name LIKE :searchTerm');
            conditions.add('SAP_Account_Number__c LIKE :searchTerm');
            conditions.add('Last_Name__c LIKE :searchTerm');
            conditions.add('First_Name__c LIKE :searchTerm');
            conditions.add('Shipping_Street__c LIKE :searchTerm');
            conditions.add('Billing_Street__c LIKE :searchTerm');
            conditions.add('Phone__c LIKE :searchTerm');
        }

        if (!conditions.isEmpty()) {
            query += String.join(conditions, ' OR ');  // OR to match any of the fields
        }

        return Database.query(query);
    }
}