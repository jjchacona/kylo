import * as angular from 'angular';
import * as _ from 'underscore';
import { Injectable, Inject } from '@angular/core';
import { RestUrlService } from '../../services/RestUrlService';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable()
export default class SlaEmailTemplateService {
    data: any = {};
    template: any = null;
    templates: any[];
    templateMap: any;
    availableActions: any[];
    
    constructor(private RestUrlService: RestUrlService,
                private http: HttpClient,
                @Inject("$injector") private $injector: any) {
        
        this.data = {
            template:this.template,
            templates:this.templates,
            templateMap:{},
            availableActions:[]
        }            
        this.getExistingTemplates();

    };
    newTemplate = () => {
        this.data.template = this.newTemplateModel();
    };
    getTemplateVariables = () => {
        var injectables = [{ "item": "$sla.name", "desc": "The SLA Name." },
        { "item": "$sla.description", "desc": "The SLA Description." },
        { "item": "$assessmentDescription", "desc": "The SLA Assessment and result." }];
        return injectables;
    }
    getExistingTemplates = () => {
        var promise = this.http.get("/proxy/v1/feedmgr/sla/email-template");
        promise.toPromise().then((response: any) => {
            if (response.data) {
                this.data.templates = response.data;
                this.data.templateMap = {};
                _.each(this.data.templates, (template: any) => {
                    this.data.templateMap[template.id] = template;
                })
            }
        });
        return promise;
    };

    getRelatedSlas = (id: any) => {
        return this.http.get("/proxy/v1/feedmgr/sla/email-template-sla-references", { params: { "templateId": id } });
    };
    getTemplate = (id: any) => {
        return this.data.templateMap[id];
    };
    getAvailableActionItems = () => {
        var def = this.$injector.get("$q").defer();
        if (this.data.availableActions == undefined || this.data.availableActions == null || this.data.availableActions.length == 0) {
            this.http.get("/proxy/v1/feedmgr/sla/available-sla-template-actions").toPromise().then((response: any) => {
                if (response.data) {
                    this.data.availableActions = response.data;
                    def.resolve(this.data.availableActions);
                }
            });
        }
        else {
            def.resolve(this.data.availableActions);
        }
        return def.promise;
    }
    validateTemplate = (subject: any, templateString: any) => {
        if (angular.isUndefined(subject)) {
            subject = this.template.subject;
        }
        if (angular.isUndefined(templateString)) {
            templateString = this.template.template;
        }
        var testTemplate = { subject: subject, body: templateString };
        return this.http.post("/proxy/v1/feedmgr/sla/test-email-template",
            angular.toJson(testTemplate),
            {headers :  new HttpHeaders({'Content-Type':'application/json; charset=utf-8'})
        });
    };
    sendTestEmail = (address: any, subject: any, templateString: any) => {
        if (angular.isUndefined(subject)) {
            subject = this.template.subject;
        }
        if (angular.isUndefined(templateString)) {
            templateString = this.template.template;
        }
        var testTemplate = { emailAddress: address, subject: subject, body: templateString };
        return this.http.post("/proxy/v1/feedmgr/sla/send-test-email-template",
           angular.toJson(testTemplate),
            {headers: new HttpHeaders({'Content-Type': 'application/json; charset=UTF-8'})
        });
    };
    save = (template: any) => {
        if (angular.isUndefined(template)) {
            template = this.data.template;
        }
        if (template != null) {
            return this.http.post("/proxy/v1/feedmgr/sla/email-template",
                angular.toJson(template),
                {headers: new HttpHeaders({'Content-Type': 'application/json; charset=UTF-8'})
            });
        }
    };
    accessDeniedDialog = () => {
        this.$injector.get("$mdDialog").show(
            this.$injector.get("$mdDialog").alert()
                .clickOutsideToClose(true)
                .title("Access Denied")
                .textContent("You do not have access to edit templates.")
                .ariaLabel("Access denied to edit templates")
                .ok("OK")
        );
    }
    newTemplateModel = () => {
        this.template = { name: '', subject: '', template: '' };
        return this.template;
    }
}
