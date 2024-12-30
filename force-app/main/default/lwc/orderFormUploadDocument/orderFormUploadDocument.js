import { LightningElement,api,wire,track } from 'lwc';
import TypeConversion from '@salesforce/apex/MappingFiles.TypeConversion';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { deleteRecord } from 'lightning/uiRecordApi';
import fetchAttachmentFiles from '@salesforce/apex/fetchAttachment.fetchAttachmentFiles';
import { refreshApex } from '@salesforce/apex';
import {NavigationMixin} from 'lightning/navigation';

export default class UploadFiles extends NavigationMixin(LightningElement) {
    @api prescriptionFiles = [];
    @api discountFiles = [];
    @api taxExemptFiles = [];
    @api recordId;
    @track wiredPrescriptionResult;
    @track wiredDiscountResult;
    @track wiredTaxResult;
    @track orderFormId;

    @track prescriptionFiles
    @track discountFiles
    @track taxExemptFiles

    constructor () {
        super()
        let jsonData = sessionStorage.getItem('orderFormData');
        this.orderFormId = JSON.parse(jsonData).orderFormId;
    }

    @track data = {
        prescriptionFiles: '',
        discountFiles: '',
        taxExemptFiles: ''
    };

    @wire(fetchAttachmentFiles,({ accountId: '$orderFormId',attachmenttype: 'Prescription' }))
    prescriptionData(result) {
        this.wiredPrescriptionResult = result;
        if (result.data) {
            this.prescriptionFiles = result.data;
            
        }
    }

    @wire(fetchAttachmentFiles,({ accountId: '$orderFormId',attachmenttype: 'Discount Document' }))
    discountData(result) {
        this.wiredDiscountResult = result;
        if (result.data) {
            this.discountFiles = result.data;
        }
    }

    @wire(fetchAttachmentFiles,({ accountId: '$orderFormId',attachmenttype: 'Tax Exemption Certificate' }))
    taxExemptData(result) {
        this.wiredTaxResult = result;
        if (result.data) {
            this.taxExemptFiles = result.data;
        }
    }

    async handleUploadFinished(event) {
        let jsonData = sessionStorage.getItem('orderFormData');
        jsonData = jsonData ? JSON.parse(jsonData) : {};
        this.data = jsonData.documentation;
        const uploadedFiles = event.detail.files;
        let contentVersion = new Map();

        event.detail.files.forEach(el => {
            contentVersion.set(el.contentVersionId,event.target.dataset.attachmenttype);
        });

        TypeConversion({ filedata: Object.fromEntries(contentVersion)});

        if (uploadedFiles.length > 0) {
            if (event.target.dataset.attachmenttype == 'Prescription') {
                this.prescriptionFiles = event.detail.files
                await refreshApex(this.wiredPrescriptionResult);
                if (jsonData) {
                    this.data.prescriptionFiles = this.prescriptionFiles;
                    jsonData.documentation = this.data;
                }
            } else if (event.target.dataset.attachmenttype == 'Discount Document') {
                this.discountFiles = event.detail.files
                await refreshApex(this.wiredDiscountResult);
                if (jsonData) {
                    this.data.discountFiles = this.discountFiles
                    jsonData.documentation = this.data;
                }
            } else if (event.target.dataset.attachmenttype == 'Tax Exemption Certificate') {
                this.taxExemptFiles = event.detail.files
                await refreshApex(this.wiredTaxResult);
                if (jsonData) {
                    this.data.taxExemptFiles = this.taxExemptFiles
                    jsonData.documentation = this.data;
                }
            }
            sessionStorage.setItem('orderFormData',JSON.stringify(jsonData));
        }

        const evt = new ShowToastEvent({
            title: 'SUCCESS',
            message: uploadedFiles.length + ' File(s) uploaded  successfully',
            variant: 'success',
        });
        this.dispatchEvent(evt);
    }

    async deleteFile(event) {
        const updateToDelete = event.target.dataset.key;

        try {
            await deleteRecord(updateToDelete);
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Attachment deleted',
                    variant: 'success'
                })
            );

            await refreshApex(this.wiredPrescriptionResult);
            await refreshApex(this.wiredDiscountResult);
            await refreshApex(this.wiredTaxResult);


        } catch (error) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error deleting record',
                    message: reduceErrors(error).join(', '),
                    variant: 'error'
                })
            );
        }
    }

    previewHandler(event){
        this[NavigationMixin.Navigate]({
            type:'standard__namedPage',
            attributes:{
                pageName:'filePreview'
            },
            state:{
                selectedRecordId: event.target.dataset.id
            }
        })
    }
}