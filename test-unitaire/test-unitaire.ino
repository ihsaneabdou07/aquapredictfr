// =====================================================
// TEST UNITAIRE CAPTEURS - ESP32
// 3 capteurs de débit + 3 capteurs de pression
// =====================================================

// ===== FLOW SENSOR PINS =====
const int flowPin1 = 4;
const int flowPin2 = 5;
const int flowPin3 = 27;

// ===== PRESSURE SENSOR PINS =====
const int pressurePin1 = 34;
const int pressurePin2 = 35;
const int pressurePin3 = 32;

// ===== FLOW PULSES =====
volatile unsigned long pulse1 = 0;
volatile unsigned long pulse2 = 0;
volatile unsigned long pulse3 = 0;

// ===== CALIBRATION FLOW =====
// Valeur provisoire. On cherche d'abord à voir si les pulses arrivent.
const float calibrationFactor1 = 7.5;
const float calibrationFactor2 = 7.5;
const float calibrationFactor3 = 7.5;

// ===== PRESSION =====
const float maxPressureBar = 12.0;   // ton ancienne valeur : 1200000 Pa = 12 bar
const float adcMax = 4095.0;
const float esp32AdcVoltage = 3.3;

// Offsets provisoires fixés à 0
float offsetPressure1 = 0.0;
float offsetPressure2 = 0.0;
float offsetPressure3 = 0.0;

// ===== TIMER =====
unsigned long lastTime = 0;

// ===== INTERRUPTS =====
void IRAM_ATTR countFlow1() {
  pulse1++;
}

void IRAM_ATTR countFlow2() {
  pulse2++;
}

void IRAM_ATTR countFlow3() {
  pulse3++;
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("======================================");
  Serial.println("  TEST UNITAIRE CAPTEURS ESP32");
  Serial.println("======================================");

  // Débit
  pinMode(flowPin1, INPUT_PULLUP);
  pinMode(flowPin2, INPUT_PULLUP);
  pinMode(flowPin3, INPUT_PULLUP);

  attachInterrupt(digitalPinToInterrupt(flowPin1), countFlow1, FALLING);
  attachInterrupt(digitalPinToInterrupt(flowPin2), countFlow2, FALLING);
  attachInterrupt(digitalPinToInterrupt(flowPin3), countFlow3, FALLING);

  // Pression
  pinMode(pressurePin1, INPUT);
  pinMode(pressurePin2, INPUT);
  pinMode(pressurePin3, INPUT);

  // Pour ESP32 : résolution ADC sur 12 bits
  analogReadResolution(12);

  lastTime = millis();

  Serial.println("Pins débit :");
  Serial.print("Flow 1 pin = "); Serial.println(flowPin1);
  Serial.print("Flow 2 pin = "); Serial.println(flowPin2);
  Serial.print("Flow 3 pin = "); Serial.println(flowPin3);

  Serial.println("Pins pression :");
  Serial.print("Pressure 1 pin = "); Serial.println(pressurePin1);
  Serial.print("Pressure 2 pin = "); Serial.println(pressurePin2);
  Serial.print("Pressure 3 pin = "); Serial.println(pressurePin3);

  Serial.println("Test lancé...");
  Serial.println();
}

void loop() {
  unsigned long now = millis();

  if (now - lastTime >= 1000) {
    float elapsedTime = (now - lastTime) / 1000.0;

    // ===== COPIE DES IMPULSIONS =====
    noInterrupts();

    unsigned long pulsesFlow1 = pulse1;
    unsigned long pulsesFlow2 = pulse2;
    unsigned long pulsesFlow3 = pulse3;

    pulse1 = 0;
    pulse2 = 0;
    pulse3 = 0;

    interrupts();

    // ===== ETAT DIGITAL DES PINS DEBIT =====
    int stateFlow1 = digitalRead(flowPin1);
    int stateFlow2 = digitalRead(flowPin2);
    int stateFlow3 = digitalRead(flowPin3);

    // ===== CALCUL FREQUENCE =====
    float freq1 = pulsesFlow1 / elapsedTime;
    float freq2 = pulsesFlow2 / elapsedTime;
    float freq3 = pulsesFlow3 / elapsedTime;

    // ===== CALCUL DEBIT =====
    float flow1 = freq1 / calibrationFactor1;
    float flow2 = freq2 / calibrationFactor2;
    float flow3 = freq3 / calibrationFactor3;

    // ===== LECTURE PRESSION BRUTE =====
    int rawPressure1 = analogRead(pressurePin1);
    int rawPressure2 = analogRead(pressurePin2);
    int rawPressure3 = analogRead(pressurePin3);

    // ===== CONVERSION ADC -> TENSION =====
    float voltagePressure1 = (rawPressure1 / adcMax) * esp32AdcVoltage;
    float voltagePressure2 = (rawPressure2 / adcMax) * esp32AdcVoltage;
    float voltagePressure3 = (rawPressure3 / adcMax) * esp32AdcVoltage;

    // ===== CONVERSION SIMPLE TENSION -> PRESSION =====
    float pressure1 = ((rawPressure1 / adcMax) * maxPressureBar) + offsetPressure1;
    float pressure2 = ((rawPressure2 / adcMax) * maxPressureBar) + offsetPressure2;
    float pressure3 = ((rawPressure3 / adcMax) * maxPressureBar) + offsetPressure3;

    // =====================================================
    // AFFICHAGE DEBUG
    // =====================================================
    Serial.println("--------------- TEST 1s ---------------");

    Serial.println(">>> CAPTEURS DE DEBIT");

    Serial.print("Flow 1 | PinState=");
    Serial.print(stateFlow1);
    Serial.print(" | Pulses=");
    Serial.print(pulsesFlow1);
    Serial.print(" | Freq=");
    Serial.print(freq1);
    Serial.print(" Hz | Debit=");
    Serial.print(flow1);
    Serial.println(" L/min");

    Serial.print("Flow 2 | PinState=");
    Serial.print(stateFlow2);
    Serial.print(" | Pulses=");
    Serial.print(pulsesFlow2);
    Serial.print(" | Freq=");
    Serial.print(freq2);
    Serial.print(" Hz | Debit=");
    Serial.print(flow2);
    Serial.println(" L/min");

    Serial.print("Flow 3 | PinState=");
    Serial.print(stateFlow3);
    Serial.print(" | Pulses=");
    Serial.print(pulsesFlow3);
    Serial.print(" | Freq=");
    Serial.print(freq3);
    Serial.print(" Hz | Debit=");
    Serial.print(flow3);
    Serial.println(" L/min");

    Serial.println();

    Serial.println(">>> CAPTEURS DE PRESSION");

    Serial.print("Pressure 1 | RAW=");
    Serial.print(rawPressure1);
    Serial.print(" | Voltage=");
    Serial.print(voltagePressure1, 3);
    Serial.print(" V | Pressure=");
    Serial.print(pressure1, 2);
    Serial.println(" bar");

    Serial.print("Pressure 2 | RAW=");
    Serial.print(rawPressure2);
    Serial.print(" | Voltage=");
    Serial.print(voltagePressure2, 3);
    Serial.print(" V | Pressure=");
    Serial.print(pressure2, 2);
    Serial.println(" bar");

    Serial.print("Pressure 3 | RAW=");
    Serial.print(rawPressure3);
    Serial.print(" | Voltage=");
    Serial.print(voltagePressure3, 3);
    Serial.print(" V | Pressure=");
    Serial.print(pressure3, 2);
    Serial.println(" bar");

    Serial.println("----------------------------------------");
    Serial.println();

    lastTime = now;
  }
}