import { LightningElement,api,wire } from 'lwc';
import submitOrderForm from '@salesforce/apex/OrderForm.submitOrderForm';
import sendMail from '@salesforce/apex/EmailManager.sendMail';

export default class Footer extends LightningElement {
    @api isbuttondisabled;
    @api isnextbuttondisabled;
    @api step;
    @api first;

    accountId;
    customerType;

    handlePrevious() {
        const event = new CustomEvent('previous',{ detail: { 'message': 'Previous' } });
        this.dispatchEvent(event);
    }

    handleSubmit() {
        let jsonData = sessionStorage.getItem('orderFormData');
        jsonData = jsonData ? JSON.parse(jsonData) : {};

        let orderFormId = jsonData.orderFormId ? jsonData.orderFormId : '';

        submitOrderForm({ orderFormId: `${orderFormId}` })
            .then(result => {
                this.records = result;
                if (jsonData.CustomerData.Email) {
                    sendMail({ address: jsonData.CustomerData.Email.toString(),subject: 'Order Confirmation and Payment Link',recordID: orderFormId,token: result });
                }

                sessionStorage.removeItem('orderFormData');
                const event = new CustomEvent('confirmation',{ detail: { 'orderid': orderFormId } });
                this.dispatchEvent(event);
            })
            .catch(error => {
                console.error(error);
            });
    }

    handleNext() {
        const event = new CustomEvent('next',{ detail: { 'message': 'Next' } });
        this.dispatchEvent(event);
    }
}