import { LightningElement, api } from 'lwc';
import submitOrderForm from '@salesforce/apex/OrderForm.submitOrderForm';


export default class Footer extends LightningElement {
    @api isbuttondisabled;
    @api isnextbuttondisabled;
    @api step;
    @api first;

    accountId;
    customerType;

    handlePrevious() {
        const event = new CustomEvent('previous', {detail:{'message':'Previous'}});
        this.dispatchEvent(event);
    }

    handleSubmit() {
        let jsonData = sessionStorage.getItem('orderFormData');
        jsonData = jsonData ? JSON.parse(jsonData) : {};

        let orderFormId = jsonData.orderFormId ? jsonData.orderFormId : '';

        submitOrderForm({ orderFormId: `${orderFormId}` })
        .then(result => {
            this.records = result;
            sessionStorage.removeItem('orderFormData');
            window.location.reload();
        })
        .catch(error => {
            console.error(error);
        });
    }

    handleNext() {
        const event = new CustomEvent('next', {detail:{'message':'Next'}});
        this.dispatchEvent(event);
    }
}