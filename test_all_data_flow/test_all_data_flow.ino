// ===== FLOW (3 capteurs) =====
volatile int pulse1 = 0;
volatile int pulse2 = 0;
volatile int pulse3 = 0;

float flow1 = 0;
float flow2 = 0;
float flow3 = 0;

// Pins débit
const int flowPin1 = 4;
const int flowPin2 = 5;
const int flowPin3 = 27;


float offset1 = 0; // 1  - 12;
float offset2 = 0; // 1- 12;
float offset3 = 0; // 1- 6.42;


// calibration (adapter selon capteur)
const float calibrationFactor = 7.5;

// ===== PRESSION (3 capteurs) =====
const int pressurePin1 = 34;
const int pressurePin2 = 35;
const int pressurePin3 = 32;

// pression max (adapter)
const float maxPressurePa = 1200000.0;

// ===== TEMPS =====
unsigned long lastTime = 0;

// ===== INTERRUPTS =====
void IRAM_ATTR count1() { pulse1++; }
void IRAM_ATTR count2() { pulse2++; }
void IRAM_ATTR count3() { pulse3++; }

void setup() {
  Serial.begin(115200);

  // débit
  pinMode(flowPin1, INPUT_PULLUP);
  pinMode(flowPin2, INPUT_PULLUP);
  pinMode(flowPin3, INPUT_PULLUP);

  attachInterrupt(digitalPinToInterrupt(flowPin1), count1, FALLING);
  attachInterrupt(digitalPinToInterrupt(flowPin2), count2, FALLING);
  attachInterrupt(digitalPinToInterrupt(flowPin3), count3, FALLING);

  // pression
  pinMode(pressurePin1, INPUT);
  pinMode(pressurePin2, INPUT);
  pinMode(pressurePin3, INPUT);

  lastTime = millis();
}

void loop() {

  if (millis() - lastTime > 1000) {

    noInterrupts();

    int p1 = pulse1;
    int p2 = pulse2;
    int p3 = pulse3;

    pulse1 = 0;
    pulse2 = 0;
    pulse3 = 0;

    interrupts();

    // ===== CALCUL DÉBIT (propre) =====
    float elapsedTime = (millis() - lastTime) / 1000.0;

    flow1 = (p1 / elapsedTime) / calibrationFactor;
    flow2 = (p2 / elapsedTime) / calibrationFactor;
    flow3 = (p3 / elapsedTime) / calibrationFactor;

    // ===== PRESSION =====
    int raw1 = analogRead(pressurePin1);
    int raw2 = analogRead(pressurePin2);
    int raw3 = analogRead(pressurePin3);

    
float pressure1 = ((raw1 / 4095.0) * maxPressurePa / 100000.0) + offset1; // en bar
float pressure2 = ((raw2 / 4095.0) * maxPressurePa / 100000.0) + offset2;
float pressure3 = ((raw3 / 4095.0) * maxPressurePa / 100000.0) + offset3;

    // ===== TEMPERATURE SIMULÉE =====
    float t = millis() / 1000.0;
    float temperature = 22 + sin(t * 0.1) * 0.1;

    // ===== JSON =====
    Serial.print("{");

    Serial.print("\"flow1\":"); Serial.print(flow1); Serial.print(",");
    Serial.print("\"flow2\":"); Serial.print(flow2); Serial.print(",");
    Serial.print("\"flow3\":"); Serial.print(flow3); Serial.print(",");

    Serial.print("\"pressure1\":"); Serial.print(pressure1); Serial.print(",");
    Serial.print("\"pressure2\":"); Serial.print(pressure2); Serial.print(",");
    Serial.print("\"pressure3\":"); Serial.print(pressure3); Serial.print(",");

    Serial.print("\"temperature\":"); Serial.print(temperature);

    Serial.println("}");

    // DEBUG console

    lastTime = millis();
  }
}