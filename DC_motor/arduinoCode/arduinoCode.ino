#include <SoftwareSerial.h>

SoftwareSerial espSerial(2, 3); // RX, TX

#define flamePin 7

void setup() {
Serial.begin(115200);
espSerial.begin(115200);
pinMode(flamePin,INPUT);

}

void loop() {
  // put your main code here, to run repeatedly:

  int isFlamed = digitalRead(flamePin);
  // Send data in a clean "Key:Value" format with a newline at the end
  Serial.print("FlameData:");
  Serial.println(isFlamed); 

  espSerial.print("FlameData:");
  espSerial.println(isFlamed); 
  
    delay(1000);

}



