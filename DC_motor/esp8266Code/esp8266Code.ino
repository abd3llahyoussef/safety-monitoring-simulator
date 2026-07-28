
#include <ESP8266WiFi.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>
#include <SoftwareSerial.h>

SoftwareSerial arduinoSerial(D5, D6); // RX, TX
//Vibration Sensor
#define vibrationPin D7//D4

//TLS Connfigration
#include <Time.h>
#include <TZ.h>
#include <LittleFS.h>
#include <CertStoreBearSSL.h>


//WiFi Connfigration
const char *ssid = "DESKTOP-B1OGNGK 8563";
const char *pass = "97@3Vc86";

//MQTT Configration
const char* MQTT_Server = "805cbd81a3a94169829feb28a5458e8f.s2.eu.hivemq.cloud";
const char* MQTT_Username = "abdallah";
const char* MQTT_Password = "Abdo123#";
const char* MQTT_ClientId = "Device0001";
const int MQTT_Port = 8883;

//MQTT topics
 char* vibrationTopic = "vibrationData";
 char* flameTopic = "flameData";
const char* subscribeTopic = "requestedData";


BearSSL::CertStore certStore;
WiFiClientSecure espClient;
void callback(char* type,byte* payload,unsigned int length);
PubSubClient *mqtt_client;

//Wifi connection function
void wifiSetup(){

  WiFi.begin(ssid,pass);

  while(WiFi.status() != WL_CONNECTED){
    Serial.print(".");
    delay(200);
  }

  Serial.println("Connected to WiFi");
  Serial.println(WiFi.SSID());
  Serial.println(WiFi.localIP());

}


void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);
  arduinoSerial.begin(115200); 

  //vibration sensor mode
  pinMode(vibrationPin,INPUT);

  
  wifiSetup();

  //TLS init
  LittleFS.begin();
  Serial.println("\n\nWelcome to IOT home Weather\n");
  setDateTime();

  int numCerts = certStore.initCertStore(LittleFS,PSTR("/certs.idx"),PSTR("/certs.ar"));

   Serial.printf("Number of CA certs read: %d\n", numCerts);
  if (numCerts == 0)
  {
    Serial.printf("No certs found. Did you run certs-from-mozilla.py and upload the LittleFS directory before running?\n");
    return; // Can't connect to anything w/o certs!
  }

  BearSSL::WiFiClientSecure *bear = new BearSSL::WiFiClientSecure();
  bear->setCertStore(&certStore);

  mqtt_client = new PubSubClient(*bear);
  mqtt_client->setServer(MQTT_Server,MQTT_Port);
  mqtt_client->setCallback(Callback);

  mqtt_connect();

}

void loop() {
  // put your main code here, to run repeatedly:
  delay(2500);

  if (!mqtt_client->loop())
    mqtt_connect();

  delay(2000);


  int isVibrated = digitalRead(vibrationPin);

  if(isVibrated == 1){
    Serial.println("there is a vibration ");
    delay(50);
  }else{
    Serial.println("there is not a vibration");
    delay(50);

  }


 if (arduinoSerial.available() > 0) {
    // Read the incoming string until the newline character
    Serial.print("hi Serial");
    String incomingData = arduinoSerial.readStringUntil('\n');
    incomingData.trim(); // Remove any hidden spaces or carriage returns

     // Parse the data if it starts with our key
    if (incomingData.startsWith("FlameData:")) {
      // Extract the value after the colon
      String valueStr = incomingData.substring(10); 
      int flameValue = valueStr.toInt();

      // Print result to USB Serial Monitor
      Serial.print("Received from Arduino -> Flame Status: ");
      Serial.println(flameValue);
      
          //flame Data 
      String flameData = "{";
      flameData += "\"flameData\":";
      flameData += ""+String(flameValue)+"";
      flameData += "}";

      mqtt_publish(flameTopic,(char*) flameData.c_str());

      if (flameValue == HIGH) {
        Serial.println("🔥 WARNING: Flame Detected!");
      } else {
        Serial.println("✅ Status: Safe");
      }
    }
  }

  
  //Vibration Data 
  String vibrationData = "{";
  vibrationData += "\"vibrationData\":";
  vibrationData += ""+String(isVibrated)+"";
  vibrationData += "}";

  mqtt_publish(vibrationTopic,(char*) vibrationData.c_str());

}


void setDateTime(){
  // You can use your own timezone, but the exact time is not used at all.
  // Only the date is needed for validating the certificates.
  configTime(TZ_Europe_Berlin, "pool.ntp.org", "time.nist.gov");

  Serial.print("Waiting for NTP time sync: ");
  time_t now = time(nullptr);
  while (now < 8 * 3600 * 2)
  {
    delay(100);
    Serial.print(".");
    now = time(nullptr);
  }
  Serial.println();

  struct tm timeinfo;
  gmtime_r(&now, &timeinfo);
  Serial.printf("%s %s", tzname[0], asctime(&timeinfo));
}


void mqtt_connect()
{
  // Loop until we're reconnected
  while (!mqtt_client->connected())
  {
    Serial.println("\nAttempting MQTT connection...");

    Serial.println("Reconnecting MQTT client to : " + String(MQTT_Server) + ":" + String(MQTT_Port));
    Serial.println("mqtt_clientId : " + String(MQTT_ClientId));
    Serial.println("mqtt_user : " + String(MQTT_Username));
    Serial.println("mqtt_password : " + String(MQTT_Password));
    // Attempt to connect
    if (mqtt_client->connect(MQTT_ClientId, MQTT_Username, MQTT_Password))
    {
      Serial.println("MQTT Client Connected");
      // Subscribe
      mqtt_subscribe(subscribeTopic);
    }
    else
    {
      Serial.print("failed, rc=");
      Serial.print(mqtt_client->state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}


void mqtt_publish(char *topic,char *data)
{
  mqtt_connect();
  Serial.println("Publish Topic: \"" + String(topic) + "\"");
  if (mqtt_client->publish(topic, data))
    Serial.println("Publish \"" + String(data) + "\" ok");
  else
    Serial.println("Publish \"" + String(data) + "\" failed");
}


void mqtt_subscribe(const char *topic)
{
  if (mqtt_client->subscribe(topic))
    Serial.println("Subscribe \"" + String(topic) + "\" ok");
  else
    Serial.println("Subscribe \"" + String(topic) + "\" failed");
}


void Callback(char* topic,byte* payload , unsigned int length){
    String command;
    Serial.print("\n\nMessage arrived [");
    Serial.print(topic);
    Serial.print("] ");

    for(int i=0;i<length;i++){
      command += (char)payload[i];
    Serial.println((char)payload[i]);
      }
    
    if (command.length() > 0){
    Serial.println("\nCMD receive is : " + command);
    }
     DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, command);
    if (error) {
        Serial.print("deserializeJson() failed: ");
        Serial.println(error.f_str());
        return; // Exit early if JSON is invalid
    }
    JsonObject obj = doc.as<JsonObject>();
    // 3. Extract the value
    String value = obj["value"].as<String>();
    
    Serial.print("Parsed JSON object: ");
    serializeJson(obj, Serial); // Correct way to print JSON objects
    Serial.println();
    
    Serial.print("Extracted Value: ");
    Serial.println(value);

}