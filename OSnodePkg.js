'use strict';

var pkgcloud = require('pkgcloud');
const fs = require('fs');
var os = require('os');
const path = require('path');


var controller = '<ip-addr>';

var createConnection
var conn

class OSPkgRequest {

    createConnection() {
        conn = {
            provider: 'openstack',
            username: '<username>',
            password: '<userpassword>',
            authUrl: 'http://' + controller + ':5000',
            region: 'RegionOne'
        };
    }

    templateUpload(template = 'data', callback) {

        //Upload a file to swift

        this.createConnection();

        var storageClient = pkgcloud.storage.createClient(conn);

        const templateFile = os.tmpdir().concat(".yaml");

        fs.writeFile(templateFile, template, function (err) {
            if (err) {
                return console.log(err);
            } else {
                var readStream = fs.createReadStream(templateFile);

                var writeStream = storageClient.upload({
                    container: '<container-name>',
                    remote: 'abcd.yml'
                });

                writeStream.on('error', function (err) {
                    console.error("Erorr:" + JSON.stringify(err, null, 4));
                    fs.unlink(templateFile);
                    callback(err);
                });

                writeStream.on('success', function (file) {
                    console.log("Template created." + JSON.stringify(file, null, 4));
                    var newObject = JSON.stringify(file);
                    console.log("New Object", newObject);
                    var templateId = file.name;
                    fs.unlink(templateFile);
                    callback(newObject);
                });

                readStream.pipe(writeStream);
            }
        });
    }

    createNewStack(templateName) {
        //create new stack 
        setTimeout(function () {
            console.log('okkkkz')
        }, 2000)
        this.createConnection();
        console.log("Template Name", templateName);
        var orchClient = pkgcloud.orchestration.createClient(conn);
        var storageClient = pkgcloud.storage.createClient(conn);


        var req = storageClient.download({
            container: '<container-name>',
            remote: templateName
        });

        var data = '';
        req.setEncoding('utf8');

        req.on('data', function (buffer) {
            data += buffer;
            console.log('stream data ' + buffer);
        });

        req.on('end', function () {
            console.log('final output ' + data);
            orchClient.createStack({
                name: templateName,
                timeout: 60,
                template: data
            }, function (err1, stack) {
                if (err1) {
                    console.error("Stack failed:" + JSON.stringify(err1, null, 4));
                } else {
                    console.log("Stack created:" + JSON.stringify(stack, null, 4));
                }
            });
        });
    }


}

var osm = new OSPkgRequest();

var template = `
heat_template_version: 2015-10-15

description: network and instances

resources:

  net-a:
    type: OS::Neutron::Net
    properties:
      name: network-a
      `

//console.log(template);

osm.templateUpload(template, function (data) {
    console.log(data);
});
console.log('-----------------------\nUpload done\n--------------');
osm.createNewStack('abcd.yml');
