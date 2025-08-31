## 🚨 **Problemática a Resolver**

Millones de personas en el mundo, especialmente en economías emergentes, carecen de acceso a servicios financieros formales porque:

* No tienen historial bancario suficiente.
* La información crediticia está fragmentada entre múltiples fuentes.
* Los sistemas actuales exponen datos sensibles, comprometiendo la privacidad.
* Los procesos de scoring tradicionales no son transparentes ni portables.

Esto genera exclusión financiera, dificulta el acceso a préstamos justos y limita la inclusión en la economía digital.

---

## 💡 **Nuestra Solución (visión general)**

Construimos un **sistema unificado de identidad y reputación crediticia** que combina **blockchain, oráculos de datos, IA y criptografía avanzada** para:

1. **Verificar identidad digital** de manera portable y auditable.
2. **Recolectar datos financieros y de consumo reales**, validados criptográficamente.
3. **Calcular un puntaje crediticio con IA sobre datos encriptados** (privacidad total).
4. **Emitir un Soulbound Token (SBT)** que representa ese puntaje y que el usuario puede usar en fintechs, bancos o protocolos DeFi.

---

## 🛠️ **La Solución en Detalle**

### **1. Identidad Digital (Lisk + Filecoin)**

* El usuario conecta su wallet y completa verificación de identidad (KYC).
* Los datos validados se almacenan en **Filecoin/IPFS**, generando un CID inmutable.
* Se emite un **SBT de identidad en Lisk**, que representa la existencia de esa identidad validada.

📌 Esto crea una **identidad digital confiable y portable**, aceptada dentro del ecosistema.

---

### **2. Solicitud de Puntaje Crediticio (Flare)**

* Una fintech solicita el puntaje de un usuario.
* El **State Connector de Flare** consulta múltiples fuentes externas (bancos, telcos, servicios).
* Los validadores de Flare generan una **atestación criptográfica**, garantizando integridad y veracidad.

📌 Garantiza que los datos usados para el scoring son **reales y auditables**, no autodeclarados.

---

### **3. Cálculo con IA y Privacidad Total (Zama FHE)**

* Los datos viajan encriptados hacia la red de **Zama**.
* Gracias a la **Encriptación Homomórfica Completa (FHE)**, un modelo de IA procesa la información sin descifrarla.
* Se obtiene un puntaje crediticio encriptado que vuelve al ecosistema.

📌 **Privacidad absoluta**: los datos nunca quedan expuestos, ni siquiera al modelo de IA.

---

### **4. Puntaje Final y Uso (Lisk + Filecoin)**

* Se guarda un **Score SBT** a través de un contrato en Lisk con datos del puntaje y de la persona.
* Los registros y proofs quedan almacenados en Filecoin/IPFS, asegurando transparencia y auditoría.
* El usuario puede usar este puntaje portable con fintechs, bancos o DeFi apps.

📌 Crea una **capa de reputación financiera global y resistente a censura**, que empodera al usuario.

---


## ⚙️ **Por qué elegimos cada tecnología**

* ## 🏗️ **1. Lisk Blockchain **
Plataforma accesible para identidad y SBTs, con gran enfoque en usabilidad y adopción de dApps. Perfecta para representar identidad y reputación en tokens no transferibles.

- **DPoS**: Finalidad en 2-3 segundos vs 12s de Ethereum
- **15,000+ TPS**: 500x más transacciones que Ethereum
- **Costos bajos**: 100x más barato que Ethereum mainnet
- **SDK TypeScript**: Desarrollo rápido y modular

* ## 🔐 **2. Zama Network - Computación Confidencial**
Permite cálculos sobre datos encriptados sin necesidad de desencriptarlos → privacidad garantizada y cumplimiento regulatorio.

- **Privacidad total**: Datos nunca se desencriptan
- **Compliance automático**: GDPR/CCPA built-in
- **AI integration**: Procesamiento en datos encriptados
- **Seguridad cuántica**: Resistente a ataques futuros
  
## 🌐 *3. Flare Network - Verificación Cross-Chain*
Oráculo de datos robusto con su **State Connector**, ideal para traer información del mundo real de manera verificable.

- **State Connector**: Acceso nativo a APIs Web2
- **Cross-chain built-in**: Diseñado para interoperabilidad
- **Costos bajos**: 10-50x más barato que Chainlink
- **100+ validadores**: Mayor descentralización

## 📁 *4. Filecoin/IPFS - Almacenamiento Descentralizado*
Almacenamiento descentralizado, inmutable y auditable para datos sensibles y trazabilidad.

- **Hash-based**: Identificación por contenido criptográfico
- **100% descentralizado**: Sin punto único de falla
- **10-100x más barato**: Que almacenamiento en la nube
- **Resistente a censura**: Imposible de bloquear

## 📜 Contratos desplegados

| Componente / Rol                     | Red (chain)              | Dirección |
|-------------------------------------|--------------------------|-----------|
| **ZAMA (cálculo/score)**            | Zama / fhEVM (ZEMA)      | `0x59A3b5AfB6bACdbEc53bc1aB13af08e20db2748c` |
| **CID Registry (vínculo a IPFS)**   | Filecoin EVM             | `0x749777126B405832d92520Ec94D22B9685595027` |
| **Score SBT / NFT**                 | Lisk EVM                 | `0x686BABbCa7924470f8c4343C6b4b702a0e0Bb5eb` |

### 🔗 Enlaces a contratos (Testnets)

- ZEMA (Zama Testnet)
  https://explorer.testnet.zama.cloud/address/0x59A3b5AfB6bACdbEc53bc1aB13af08e20db2748c

- CID Registry (Filecoin Calibration)
  https://filecoin-testnet.blockscout.com/address/0x749777126B405832d92520Ec94D22B9685595027

- Score SBT / NFT (Lisk Sepolia)
  https://sepolia-blockscout.lisk.com/address/0x686BABbCa7924470f8c4343C6b4b702a0e0Bb5eb


## 🎯 *¿Por Qué Esta Arquitectura?*

### *Ventajas Clave*
- *Especialización*: Cada red hace se ocupa de una parte específica en la que se destaca
- *Seguridad*: Múltiples capas de protección
- *Escalabilidad*: Cada red escala independientemente
- *Innovación*: Fácil integración de nuevas tecnologías

