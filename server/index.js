import whois from 'whois-json';
import express from "express";
import http from "http";
import { Server as IOServer } from "socket.io";
import queue from "./queue.js";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios"; 

const PORT = 3000;
const app = express();
const server = http.createServer(app);
const io = new IOServer(server, {
    cors: {
        origin: "http://localhost:5173",
    },
});

//HANDLING LISTENERS DISPLYING
function removeItemOnce(arr, value) {
    let arr1 = arr.map( el => el[0]);
    var index = arr1.indexOf(value);
    if (index > -1) {
      arr.splice(index, 1);
    }
    return arr;
};
  
function removeItemAll(arr, value) {
    var i = 0;
    while (i < arr.length) {
        if (arr[i[0]] === value) {
        arr.splice(i, 1);
        } else {
        ++i;
        }
    }
    return arr;
};

function getPrettyTime(datetime) {
    var day = datetime.getDate();
    var hours = datetime.getHours();
    if (hours < 10) hours = '0' + hours;
    var minutes = datetime.getMinutes();
    if (minutes < 10) minutes = '0' + minutes;
    return hours + ':' + minutes;
}

function showListeneres(data){
    console.table(data)
};

let listeners =[];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.join(__dirname, "../dist");

app.use(express.static(outputDir));

// app.get("/", function (req, res) {
//     res.sendFile(path.join(outputDir, "index.html"));
// });

(async () => {
    await queue.loadTracks("tracks");
    queue.play();

    io.on("connection", (socket) => {
        // Every new streamer must receive the header
        if (queue.bufferHeader) {
            socket.emit("bufferHeader", queue.bufferHeader);
        }

        socket.on("bufferHeader", (header) => {
            queue.bufferHeader = header;
            socket.broadcast.emit("bufferHeader", queue.bufferHeader);
        });

        socket.on("stream", (packet) => {
            // Only broadcast microphone if a header has been received
            if (!queue.bufferHeader) return;

            // Audio stream from host microphone
            socket.broadcast.emit("stream", packet);
        });

        socket.on("control", (command) => {
            switch (command) {
                case "pause":
                    queue.pause();
                    break;
                case "resume":
                    queue.resume();
                    break;
            }
        });
    });
    
async function getIPInfo(ip){

    const options = {
        method: 'GET',
        url: `ipinfo.io/${ip}?token=f320fa541847e7`,
        // params: {ip: IP},
        // headers: {
        //   'X-RapidAPI-Key': '0f99a3d285mshed03ba69a69175ap16052cjsnca193b26da19',
        //   'X-RapidAPI-Host': 'zozor54-whois-lookup-v1.p.rapidapi.com'
        // }
      };
      
      await axios.request(options).then(function (response) {
        return `${response.city}, ${response.city}`;
      }).catch(function (error) {
          console.error(error);
      });
};

    // http STREAM FOR MUSIC
    app.get("/stream", async (req, res) => {
        const { id, client } = queue.addClient();
        let ip = req.ip.substring(7, req.ip.length);
        console.log(getPrettyTime(new Date()).toString() + ': a listener connected, IP: ' + ip);
        listeners.push([ip]);
        // listeners.push([ip, await getIPInfo(ip)]);
        showListeneres(listeners);
        res.set({
            "Content-Type": "audio/mp3"
            // "Transfer-Encoding": "chunked",
        }).status(200);

        client.pipe(res);

        req.on("close", () => {
            console.log(getPrettyTime(new Date()).toString() + ': a listener disconnected, IP: ' + ip);
            removeItemOnce(listeners, ip);
            showListeneres(listeners);
            queue.removeClient(id);
        });
    });
    //registryData.registrant.city, registryData.registrant.country
    // {
    //     "WhoisRecord": {
    //         "domainName": "95.52.154.54",
    //         "parseCode": 8,
    //         "audit": {
    //             "createdDate": "2023-02-05 15:48:47 UTC",
    //             "updatedDate": "2023-02-05 15:48:47 UTC"
    //         },
    //         "registrarName": "RIPE",
    //         "registrarIANAID": "1507",
    //         "registryData": {
    //             "createdDate": "2017-03-23T11:34:56Z",
    //             "updatedDate": "2017-03-23T11:35:18Z",
    //             "registrant": {
    //                 "name": "PJSC \"North-West Telecom\"",
    //                 "organization": "RU-AVANGARD-DSL",
    //                 "street1": "Novgorod branch of the PJSC \"Rostelecom\" North-West Region",
    //                 "city": "2 Lyudogoshcha st., 173007, Velikiy Novgorod, Russia",
    //                 "country": "RUSSIAN FEDERATION",
    //                 "countryCode": "RU",
    //                 "rawText": "netname:        RU-AVANGARD-DSL\ndescr:          PJSC \"North-West Telecom\"\ndescr:          Novgorod branch of the PJSC \"Rostelecom\" North-West Region\ndescr:          2 Lyudogoshcha st., 173007, Velikiy Novgorod, Russia\ncountry:        RU\n"
    //             },
    //             "domainName": "95.52.154.54",
    //             "status": "ASSIGNED PA",
    //             "rawText": "% This is the RIPE Database query service.\n% The objects are in RPSL format.\n%\n% The RIPE Database is subject to Terms and Conditions.\n% See http://www.ripe.net/db/support/db-terms-conditions.pdf\n\n% Information related to '95.52.128.0 - 95.52.159.255'\n\n% Abuse contact for '95.52.128.0 - 95.52.159.255' is 'abuse@rt.ru'\n\ninetnum:        95.52.128.0 - 95.52.159.255\nnetname:        RU-AVANGARD-DSL\ndescr:          PJSC \"North-West Telecom\"\ndescr:          Novgorod branch of the PJSC \"Rostelecom\" North-West Region\ndescr:          2 Lyudogoshcha st., 173007, Velikiy Novgorod, Russia\ncountry:        RU\nadmin-c:        RCR3-RIPE\ntech-c:         RCR3-RIPE\nstatus:         ASSIGNED PA\nmnt-by:         AS8997-MNT\nmnt-lower:      AS8997-MNT\nmnt-domains:    AS8997-MNT\nmnt-routes:     AS8997-MNT\ncreated:        2021-08-27T12:11:16Z\nlast-modified:  2021-08-27T12:11:16Z\nsource:         RIPE\n\nrole:           ru.spbnit contact role\naddress:        OJSC Rostelecom\naddress:        Macro-regional branch Northwest\naddress:        14/26 Gorokhovaya str. (26 Bolshaya Morskaya str.)\naddress:        191186, St.-Petersburg\naddress:        Russia\nphone:          +7 812 595 45 56\ne-mail:         gsz.lir@nw.rt.ru\nremarks:        --------------------------------------------\nadmin-c:        AA728-RIPE\nadmin-c:        VE128-RIPE\ntech-c:         AA728-RIPE\ntech-c:         VE128-RIPE\ntech-c:         TR4627-RIPE\ntech-c:         RT8555-RIPE\nnic-hdl:        RCR3-RIPE\nremarks:        --------------------------------------------\nremarks:        General questions: ip-noc(at)nw.rt.ru\nremarks:        Routing & peering: ip-noc(at)nw.rt.ru\nremarks:        --------------------------------------------\nabuse-mailbox:  abuse@rt.ru\nmnt-by:         AS8997-MNT\ncreated:        2002-09-04T09:29:24Z\nlast-modified:  2022-10-26T15:50:20Z\nsource:         RIPE\n\n% Information related to '95.52.128.0/18AS12389'\n\nroute:          95.52.128.0/18\ndescr:          PJSC \"Rostelecom\" North-West region\norigin:         AS12389\nmnt-by:         AS8997-MNT\ncreated:        2017-03-23T11:34:56Z\nlast-modified:  2017-03-23T11:35:18Z\nsource:         RIPE\n\n% This query was served by the RIPE Database Query Service version 1.105 (SHETLAND)",
    //             "parseCode": 1081,
    //             "header": "% This is the RIPE Database query service.\n% The objects are in RPSL format.\n%\n% The RIPE Database is subject to Terms and Conditions.\n% See http://www.ripe.net/db/support/db-terms-conditions.pdf",
    //             "strippedText": "\n% Information related to '95.52.128.0 - 95.52.159.255'\n\n% Abuse contact for '95.52.128.0 - 95.52.159.255' is 'abuse@rt.ru'\n\ninetnum:        95.52.128.0 - 95.52.159.255\nnetname:        RU-AVANGARD-DSL\ndescr:          PJSC \"North-West Telecom\"\ndescr:          Novgorod branch of the PJSC \"Rostelecom\" North-West Region\ndescr:          2 Lyudogoshcha st., 173007, Velikiy Novgorod, Russia\ncountry:        RU\nadmin-c:        RCR3-RIPE\ntech-c:         RCR3-RIPE\nstatus:         ASSIGNED PA\nmnt-by:         AS8997-MNT\nmnt-lower:      AS8997-MNT\nmnt-domains:    AS8997-MNT\nmnt-routes:     AS8997-MNT\ncreated:        2021-08-27T12:11:16Z\nlast-modified:  2021-08-27T12:11:16Z\nsource:         RIPE\n\nrole:           ru.spbnit contact role\naddress:        OJSC Rostelecom\naddress:        Macro-regional branch Northwest\naddress:        14/26 Gorokhovaya str. (26 Bolshaya Morskaya str.)\naddress:        191186, St.-Petersburg\naddress:        Russia\nphone:          +7 812 595 45 56\ne-mail:         gsz.lir@nw.rt.ru\nremarks:        --------------------------------------------\nadmin-c:        AA728-RIPE\nadmin-c:        VE128-RIPE\ntech-c:         AA728-RIPE\ntech-c:         VE128-RIPE\ntech-c:         TR4627-RIPE\ntech-c:         RT8555-RIPE\nnic-hdl:        RCR3-RIPE\nremarks:        --------------------------------------------\nremarks:        General questions: ip-noc(at)nw.rt.ru\nremarks:        Routing & peering: ip-noc(at)nw.rt.ru\nremarks:        --------------------------------------------\nabuse-mailbox:  abuse@rt.ru\nmnt-by:         AS8997-MNT\ncreated:        2002-09-04T09:29:24Z\nlast-modified:  2022-10-26T15:50:20Z\nsource:         RIPE\n\n% Information related to '95.52.128.0/18AS12389'\n\nroute:          95.52.128.0/18\ndescr:          PJSC \"Rostelecom\" North-West region\norigin:         AS12389\nmnt-by:         AS8997-MNT\ncreated:        2017-03-23T11:34:56Z\nlast-modified:  2017-03-23T11:35:18Z\nsource:         RIPE\n\n% This query was served by the RIPE Database Query Service version 1.105 (SHETLAND)",
    //             "audit": {
    //                 "createdDate": "2023-02-05 15:48:47 UTC",
    //                 "updatedDate": "2023-02-05 15:48:47 UTC"
    //             },
    //             "customField1Name": "netRange",
    //             "customField1Value": "95.52.128.0 - 95.52.159.255",
    //             "registrarName": "RIPE",
    //             "registrarIANAID": "1507",
    //             "createdDateNormalized": "2017-03-23 00:00:00 UTC",
    //             "updatedDateNormalized": "2017-03-23 00:00:00 UTC",
    //             "customField2Name": "netName",
    //             "customField3Name": "ASN",
    //             "customField2Value": "RU-AVANGARD-DSL",
    //             "customField3Value": "AS12389"
    //         },
    //         "domainAvailability": "UNAVAILABLE",
    //         "contactEmail": "abuse@rt.ru",
    //         "domainNameExt": ".54",
    //         "estimatedDomainAge": 2145
    //     }
    // }






    server.listen(PORT, () => {
        console.log(`Listening on port ${PORT}`);
    });
})();

export {};
