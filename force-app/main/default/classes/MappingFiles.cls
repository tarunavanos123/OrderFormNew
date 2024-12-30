public class MappingFiles {
	@AuraEnabled
    public static void TypeConversion(Map<String, String> filedata) {

		Map<Id, String> mMap = new Map<Id, String>();

        for(String key: filedata.keySet()){
			Id contentId = (Id) key;
			mMap.put(contentId, filedata.get(key));
		}

		List<ContentVersion> contentData = [Select Id, Title, Attachment_Type__c from ContentVersion where Id in :mMap.keySet()];
        for(ContentVersion con: contentData){
			con.Attachment_Type__c = mMap.get(con.Id);
		}
		Database.SaveResult[] svData = Database.update(contentData);
    }
}