public with sharing class fetchAttachment {
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> fetchAttachmentFiles(Id accountId, String attachmenttype) {

        List<ContentDocumentLink> records = [
            SELECT ContentDocumentId, 
                   ContentDocument.Title, 
                   ContentDocument.LatestPublishedVersion.Attachment_Type__c 
            FROM ContentDocumentLink 
            WHERE LinkedEntityId = :accountId AND ContentDocument.LatestPublishedVersion.Attachment_Type__c = :attachmenttype
              
        ];

        List<Map<String, String>> flattenedData = new List<Map<String, String>>();
        for (ContentDocumentLink record : records) {
            flattenedData.add(new Map<String, String>{
                'ContentDocumentId' => record.ContentDocumentId,
                'Title' => record.ContentDocument.Title,
                'AttachmentType' => record.ContentDocument.LatestPublishedVersion.Attachment_Type__c
            });
        }
        return flattenedData;
    }
}