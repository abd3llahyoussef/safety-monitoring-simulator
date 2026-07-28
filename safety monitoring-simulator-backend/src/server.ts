import cors from "cors";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { client } from "./client";
import { WebSocketServer, WebSocket } from 'ws';
import mqtt from 'mqtt';
import http from "http";

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;
const server = http.createServer(app);

app.use(cors());

app.get("/", async (req: Request, res: Response) => {
    try {
        const result = await client.query("SELECT * FROM sensor_data");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching data" });
    }
});

client.connect()
    .then(() => {
        console.log("Connected to database");
        server.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    })
    .catch((err) => {
        console.error("Failed to connect to the database:", err);
    });

//mqtt configration
const wss: WebSocketServer = new WebSocketServer({ server });


//mqtt configration
const mqttOptions = {
    clientId: process.env.MQTT_Client_Id as string,
    username: process.env.MQTT_Username as string,          // if required
    password: process.env.MQTT_Password as string,          // if required
    clean: true,
    connectTimeout: 5000,
    reconnectPeriod: 2000,
    keepalive: 60,
    // SSL/TLS options if needed
    // ca: fs.readFileSync('./ca.crt'),
    // key: fs.readFileSync('./client.key'),
    // cert: fs.readFileSync('./client.crt'),
};

const brokerUrl = process.env.MQTT_Server as string; // change to your broker URL
const mqttClient: mqtt.MqttClient = mqtt.connect(brokerUrl, mqttOptions);


mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker');

    // Subscribe to a topic
    const flameTopic = process.env.MQTT_flameTobic as string;
    const vibrationTopic = process.env.MQTT_vibrationTopic as string;
    mqttClient.subscribe(flameTopic, (err) => {
        if (!err) {
            console.log(`Subscribed to topic: ${flameTopic}`);
        } else {
            console.error('Subscription error:', err);
        }
    });
    mqttClient.subscribe(vibrationTopic, (err) => {
        if (!err) {
            console.log(`Subscribed to topic: ${vibrationTopic}`);
        } else {
            console.error('Subscription error:', err);
        }
    });
});

wss.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('message', (message: Buffer) => {
        console.log(`Received message: ${message}`);
        let msg = JSON.parse(message.toString());
        // mqttClient.publish(process.env.MQTT_PublishedTobic as string, JSON.stringify(msg), { qos: 1 });
        //broadcast(message.toString());
    });

    socket.on('close', () => {
        console.log('Client disconnected');
    });
});

mqttClient.on('message', (topic, payload) => {
    console.log(`Message received on topic ${topic}: ${payload.toString()}`);
    let msg = JSON.parse(payload.toString());
    console.log("Message :", msg);
    /*setImmediate(() => {
        client.query("INSERT INTO iot_data (temperaturecelsius,temperaturefahrenheit, humidity) VALUES ($1, $2,$3)", [msg.temperaturecelsius, msg.temperaturefahrenheit, msg.humidity]).then(() => {
            console.log("Data inserted into database");
        }).catch((err) => {
            console.error("Failed to insert data into database:", err);
        });
    });*/
    broadcast(payload.toString());
});

mqttClient.on('error', (err) => {
    console.error('MQTT error:', err);
    mqttClient.reconnect();
});

mqttClient.on('close', () => {
    console.log('MQTT connection closed');
});

function broadcast(message: string) {
    wss.clients.forEach((client) => {
        client.send(message);
    });
}