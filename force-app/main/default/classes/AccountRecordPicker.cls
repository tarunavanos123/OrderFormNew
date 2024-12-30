public with sharing class AccountRecordPicker {
    @AuraEnabled(cacheable=true)
    public static List<SAP_Account__c> searchAccounts(String searchTerm) {
        String query = 'SELECT Id, Name, GB_SAP_Account_Number__c, GB_Street_House_No__c, GB_Street_2__c FROM SAP_Account__c WHERE ';
        List<String> conditions = new List<String>();

        if (!String.isEmpty(searchTerm)) {
            conditions.add('Name LIKE :searchTerm');
            conditions.add('GB_SAP_Account_Number__c LIKE :searchTerm');
            conditions.add('GB_Street_House_No__c LIKE :searchTerm');
            conditions.add('GB_Street_2__c LIKE :searchTerm');
        }

        if (!conditions.isEmpty()) {
            query += String.join(conditions, ' OR ');  // OR to match any of the fields
        }

        return Database.query(query);
    }
}