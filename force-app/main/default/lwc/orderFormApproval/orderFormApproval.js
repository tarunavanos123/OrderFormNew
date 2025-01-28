import { LightningElement, track, api, wire } from 'lwc';
import NoHeader from '@salesforce/resourceUrl/NoHeader';
import { loadStyle, loadScript } from 'lightning/platformResourceLoader';
import AvanosLogo from '@salesforce/resourceUrl/AvanosLogo';
import getOrderFormProductData from '@salesforce/apex/OrderFormApproval.getOrderFormProductData';
import orderFormApprove from '@salesforce/apex/OrderFormApproval.orderFormApprove';
import orderFormDecline from '@salesforce/apex/OrderFormApproval.orderFormDecline';
import { getRecordUi } from 'lightning/uiRecordApi';
import getIPAddress from '@salesforce/apex/OrderFormApproval.getIPAddress';
import { CurrentPageReference } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
// import jsPDF from '@salesforce/resourceUrl/jsPDF';
// import html2canvas from '@salesforce/resourceUrl/html2canvas';


export default class orderFormApproval extends LightningElement {
    Avanos_Logo = AvanosLogo;
    @api recordId;

    @wire(getRecordUi, { recordIds: '$recordId', layoutTypes: ['Full'], modes: ['View'] })
    recordUi;

    // isLibrariesLoaded = false;
    renderMode = 'light';
    productData = [];
    ipAddress;
    comments = '';
    error = ''; // To handle errors
    form1 = true;
    form2 = false;
    approvalSignaturName = ''; // To store the input value

    handleInputChange(event) {
        this.approvalSignaturName = event.target.value; 
    }

    connectedCallback() {
        loadStyle(this, NoHeader);
    }

    renderedCallback() {
        if (!this.canvas) {
            this.canvas = this.template.querySelector('.signature-canvas');
            this.context = this.canvas.getContext('2d');
            this.setCanvasSize();
            this.context.lineWidth = 2;
            this.context.lineCap = 'round';
            this.context.strokeStyle = '#000';
        }

        // if (this.isLibrariesLoaded) {
        //     return;
        // }
        // Promise.all([
        //     loadScript(this, jsPDF),
        //     loadScript(this, html2canvas)
        // ])
        // .then(() => {
        //     this.isLibrariesLoaded = true;
        //     console.log('@@@ lib found');
        // })
        // .catch(error => {
        //     console.error('Error loading libraries', error);
        // });
    }

    @wire(getIPAddress)
    wiredIpAddress({ error, data }) {
        if (data) {
            this.ipAddress = data;
            console.log('User IP Address:', this.ipAddress);
        } else if (error) {
            console.error('Error retrieving IP address:', error);
        }
    }

    @wire(CurrentPageReference)
    getCurrentPageReference(currentPageReference) {
        if (currentPageReference) {
            this.recordId = currentPageReference.state.recordId;    // Extract the 'recordId' parameter from the URL.
            console.log('URL Record ID:', this.recordId);
        }
    }

    @wire(getOrderFormProductData, { recordId: '$recordId' })
    OrderFormProductData({ error, data }) {
        if (data) {
            this.productData = data;

            this.productData = this.productData.map((product, index) => ({
            ...product,
            index: index + 1 
            }));
        } else if(error){
            console.log('@@@ error : '+JSON.stringify(error));
        }
        console.log('@@@ productData : '+JSON.stringify(this.productData));
    }

    handleCommentsChange(event) {
        this.comments = event.target.value;
    }

    drawnSignature = '';
    approverSignature = null;
    userUploadDoc = null;

    handleDrawSignature() {
        const dataUrl = this.canvas.toDataURL('image/png');
        this.drawnSignature = dataUrl.split(',')[1];
        console.log('Signature Data :', this.drawnSignature);
    }

    handleApproverSignature(event) {
        const uploadedFiles = event.detail.files;
        if (uploadedFiles.length > 0) {
            this.approverSignature = uploadedFiles[0].documentId;
            console.log('Uploaded Signature:', this.approverSignature);
        }
    }

    handleUserUploadFinished(event) {
        const uploadedFiles = event.detail.files;
        if (uploadedFiles.length > 0) {
            this.userUploadDoc = uploadedFiles[0].documentId;
            console.log('Uploaded Signature:', this.userUploadDoc);
        }
    }

    handleApprove() {
        console.log('handleApprove recordId : '+this.recordId);
        console.log('handleApprove comments : '+this.comments);

        if(this.approverSignature || this.drawnSignature){
            console.log('Approve button clicked');
            orderFormApprove({ recordId: this.recordId, comments: this.comments, drawnSig: this.drawnSignature, uploadSign: this.approverSignature, approvalSignaturName: this.approvalSignaturName, userUploadDoc: this.userUploadDoc})
            .then(() => {
                this.showToast('Success', 'Record updated successfully', 'success');
                this.form1 = false;
                this.form2 = true;
            })
            .catch((error) => {
                this.showToast('Error', 'Failed to update record: ' + JSON.stringify(error), 'error');
            });
        } else {
            this.showToast('Error', 'Please upload or draw Signature. ', 'error');
        }

        // if (!this.isLibrariesLoaded) {
        //     console.error('Libraries not loaded');
        //     return;
        // }

        // const content = this.template.querySelector('.pdfApproval'); // Select the content to convert
        
        // console.log('@@@ content : '+content);
        // if (!content) {
        //     console.error('Content not found');
        //     return;
        // }

        // console.log('html2canvas:', window.html2canvas);
        // console.log('jsPDF:', jsPDF);

        // // Capture content as a PDF
        // window.html2canvas(content)
        // .then(canvas => {
        //     console.log('@@@ 1234 ');
        //     const imgData = canvas.toDataURL('image/png');
        //     const pdf = new jsPDF('p', 'mm', 'a4');
        //     const pdfWidth = pdf.internal.pageSize.getWidth();
        //     const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        //     pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            
        //     // Convert PDF to Base64
        //     const pdfBase64 = pdf.output('datauristring').split(',')[1];

        //     // Call Apex to send email
        //     console.log('@@@ pdfBase64 : '+pdfBase64);
        // })
        // .catch((error) => {
        //     console.log('456 error : '+error);
        // });

    }

    handleDecline() {
        console.log('handleDecline recordId : '+this.recordId);
        console.log('handleDecline comments : '+this.comments);

        if(this.comments == ''){
            this.showToast('Error', 'Please add comments. ', 'error');
        } else if(this.approverSignature || this.drawnSignature){
            orderFormDecline({ recordId: this.recordId, comments: this.comments, drawnSig: this.drawnSignature, uploadSign: this.approverSignature, approvalSignaturName: this.approvalSignaturName, userUploadDoc: this.userUploadDoc})
            .then(() => {
                this.showToast('Success', 'Record updated successfully', 'success');
            })
            .catch((error) => {
                this.showToast('Error', 'Failed to update record: ' + JSON.stringify(error), 'error');
            });
            console.log('Decline button clicked');
        } else {
            this.showToast('Error', 'Please upload or draw Signature. ', 'error');
        }
    }

    showToast(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(evt);
    }

    get recordData() {
        return this.recordUi?.data?.records?.[this.recordId]?.fields || {};
    }
    get companyName() {
        return this.recordData.Company_Name__c?.value || '';
    }
    get poNumber() {
        return this.recordData.PO__c?.value || '';
    }
    get firstName() {
        return this.recordData.First_Name__c?.value || '';
    }
    get lastName() {
        return this.recordData.Last_Name__c?.value || '';
    }
    get email() {
        return this.recordData.Email__c?.value || '';
    }
    get phone() {
        return this.recordData.Phone__c?.value || '';
    }
    get fax() {
        return this.recordData.Fax__c?.value || '';
    }
    //-------------------------Billing Address---------------------------------//
    get billingStreet() {
        return this.recordData.Billing_Street__c?.value || '';
    }
    get billingCity() {
        return this.recordData.Billing_City__c?.value || '';
    }
    get billingState() {
        return this.recordData.Billing_State__c?.value || '';
    }
    get billingCountry() {
        return this.recordData.Billing_Country__c?.value || '';
    }
    get billingZip() {
        return this.recordData.Billing_Zip_Postal_Code__c?.value || '';
    }
    //-------------------------Shipping Address---------------------------------//
    get shippingStreet() {
        return this.recordData.Shipping_Street__c?.value || '';
    }
    get shippingCity() {
        return this.recordData.Shipping_City__c?.value || '';
    }
    get shippingState() {
        return this.recordData.Shipping_State__c?.value || '';
    }
    get shippingCountry() {
        return this.recordData.Shipping_Country__c?.value || '';
    }
    get shippingZip() {
        return this.recordData.Shipping_Zip_Postal_Code__c?.value || '';
    }

    isDrawing = false;
    canvas;
    context;

    setCanvasSize() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = 100; // Fixed height for the signature area
    }

    startDrawing(event) {
        this.isDrawing = true;
        this.context.beginPath();
        this.context.moveTo(event.offsetX, event.offsetY);
    }

    draw(event) {
        if (this.isDrawing) {
            this.context.lineTo(event.offsetX, event.offsetY);
            this.context.stroke();
        }
    }

    stopDrawing() {
        this.isDrawing = false;
        this.context.closePath();

        const dataUrl = this.canvas.toDataURL('image/png');
        this.drawnSignature = dataUrl.split(',')[1];
        console.log('Signature Data stopDrawing :', this.drawnSignature);
    }

    clearDrawSignature() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    @track document;
    @track productinfo;
    @track finalData = {
        subtotal: 0.00,
        selectedShippingPrice: 0.00,
        estimatedTax: 0.00,
        discountAmount: 0.00,
        handlingFee: 0.00,
        totalPrice: 0.00,
    };


}