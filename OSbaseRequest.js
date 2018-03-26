'use strict';

var request = require('request');
var controller = '<ip-addr>';

class OS {
    getToken(callback) {
        var options = {
            method: 'POST',
            url: 'http://' + controller + ':5000/v3/auth/tokens',
            headers: { 'content-type': 'application/json' },
            body:
            {
                auth:
                {
                    identity:
                    {
                        methods: ['password'],
                        password:
                        {
                            user:
                            {
                                name: '<username>',
                                domain: { name: 'Default' },
                                password: '<userpassword>'
                            }
                        }
                    }
                }
            },
            json: true
        };

        request(options, function (error, response, body) {
            if (error) throw new Error(error);
            // console.log(response.statusCode);
            // if (response.statusCode != 200 || response.statusCode != 201) {
            //     callback(body.error.message); 
            // }

            var resData = JSON.parse(JSON.stringify(response));
            var bodyData = JSON.parse(JSON.stringify(body));
            var projectId = bodyData.token.project.id;
            var token = resData.headers['x-subject-token'];
            var authData = {
                'projectID': projectId,
                'token': token
            };

            callback(authData);

        });
    }

    getHypervisorStats(callback) {

        this.getToken(function (auth) {
            //console.log(auth);

            var options = {
                method: 'GET',
                url: 'http://' + controller + ':8774/v2.1/' + auth['projectID'] + '/os-hypervisors/statistics',
                headers:
                {
                    'x-auth-token': auth['token'],
                    'content-type': 'application/json'
                }
            };

            //console.log(options);
            request(options, function (error, response, body) {
                if (error) throw new Error(error);

                //console.log(response.statusCode);

                //if (response.statusCode != 200 || response.statusCode != 201) callback(body.error.message);

                var data = JSON.parse(body);

                data = data.hypervisor_statistics;

                var heypervisorStats = {
                    'memory_mb_consumption': data.memory_mb_used,
                    'total_mb': data.memory_mb,
                    'vcpus_consumption': data.vcpus_used,
                    'tatal_vcpus': data.vcpus,
                    'disk_consumption': data.local_gb_used,
                    'total_disk': data.local_gb

                }
                callback(heypervisorStats);
            });

        });

    }

    getComputeServiceStatus(callback) {
        this.getToken(function (auth){
            var options = {
                method: 'GET',
                url: 'http://' + controller + ':8774/v2.1/' + auth['projectID'] + '/os-services',
                headers:
                {
                    'x-auth-token': auth['token'],
                    'content-type': 'application/json'
                }
            };

            request(options, function (error, response, body) {
                if (error) throw new Error(error);

                //console.log(response.statusCode);

                var serviceFlag = true;
                var bodyData = JSON.parse(body);
                var serviceList = bodyData.services;

                for (var i = 0; i < serviceList.length; i++) {
                    if (serviceList[i].state !== 'up') {
                        serviceFlag = false;
                    }

                }

                if (!serviceFlag) {callback(0);}
                else {callback(1);}

            });

        });
    }

    getNeutronServiceStatus(callback) {
        this.getToken(function (auth){
            var options = {
                method: 'GET',
                url: 'http://' + controller + ':9696/v2.0/agents.json',
                headers:
                {
                    'x-auth-token': auth['token'],
                    'content-type': 'application/json'
                }
            };

            request(options, function (error, response, body) {
                if (error) throw new Error(error);

                //console.log(response.statusCode);

                var serviceFlag = true;
                var bodyData = JSON.parse(body);
                var serviceList = bodyData.agents;
                //console.log(typeof(serviceList[0].alive));

                for (var i = 0; i < serviceList.length; i++) {
                    if (serviceList[i].alive !== true) {
                        serviceFlag = false;
                        serviceList[i].alive
                    }

                }

                if (!serviceFlag) {callback(0);}
                else {callback(1);}
                

            });

        });
    }
}

var os = new OS();
os.getNeutronServiceStatus(function (data){
    console.log(data);
});
// os.getToken(function (data) {
//     console.log(data);

// });

