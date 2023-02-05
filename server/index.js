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
    
async function getIPInfo(IP){

    const options = {
        method: 'GET',
        url: 'https://zozor54-whois-lookup-v1.p.rapidapi.com/getDomainsFromIp',
        params: {ip: IP},
        headers: {
          'X-RapidAPI-Key': '0f99a3d285mshed03ba69a69175ap16052cjsnca193b26da19',
          'X-RapidAPI-Host': 'zozor54-whois-lookup-v1.p.rapidapi.com'
        }
      };
      
      await axios.request(options).then(function (response) {
          return response.data.city;
      }).catch(function (error) {
          console.error(error);
      });
};

    // http STREAM FOR MUSIC
    app.get("/stream", async (req, res) => {
        const { id, client } = queue.addClient();
        let ip = req.ip.substring(7, req.ip.length);
        console.log(getPrettyTime(new Date()).toString() + ': a listener connected, IP: ' + ip);
        listeners.push([ip, await getIPInfo(ip)]);
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

    server.listen(PORT, () => {
        console.log(`Listening on port ${PORT}`);
    });
})();

export {};
