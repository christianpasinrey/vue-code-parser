# 🎯 vue-code-parser

> 🧩 Composable para Vue 3 para detectar, validar y parsear códigos de barras (EAN-13, EAN-14), QR y DataMatrix (GS1).

Este paquete te permite trabajar con inputs escaneados o digitados que contienen información estructurada como **GTIN**, **LOTE**, **FECHA**, **SERIAL**, etc., incluyendo parsing avanzado de códigos GS1.

---

## 🚀 Instalación

```bash
npm install vue-code-parser
```

---

## 🧠 ¿Qué hace?

Detecta el tipo de código escaneado (EAN, QR, DataMatrix) y lo convierte en un objeto legible:

- ✅ Validación EAN-13 y EAN-14 con cálculo de dígito de control
- ✅ Parsing de DataMatrix (con soporte GS1 y AI como `01`, `10`, `17`, etc.)
- ✅ Detección de QR y extracción del payload
- ✅ Buffer con debounce para evitar repeticiones en escáneres
- ✅ Manejo de caracteres invisibles (como `charCode === 29`)

---

## 🧰 Uso básico

```ts
import { useCodeParser } from "vue-code-parser";

const {
  handleInput,
  parsedResult,
  isParsedResultArray,
  detectType,
  isQr,
  checkInvisibleChars
} = useCodeParser();

// En algún método:
handleInput(']d20112345678901234101725010110ABC123+')
  .then(() => {
    console.log(parsedResult.value);
  });
```

---

## 🧾 Resultado esperado (DataMatrix GS1)

```ts
[
  { code: "01", value: "12345678901234", name: "Global Trade Item Number", description: "GTIN" },
  { code: "17", value: "250101", name: "Expiration date (YYMMDD)", description: "FECHA DE CACUCIDAD" },
  { code: "10", value: "ABC123", name: "Batch or lot number", description: "LOTE" }
]
```

---

## 📦 API completa

<div align="center">

<table>
  <tr>
    <th>Propiedad</th>
    <th>Tipo</th>
    <th>Descripción</th>
  </tr>
  <tr>
    <td><code>handleInput(code)</code></td>
    <td><code>Promise&lt;unknown&gt;</code></td>
    <td>Procesa el código escaneado con debounce.</td>
  </tr>
  <tr>
    <td><code>parsedResult</code></td>
    <td><code>Ref&lt;string \| CodePart[] \| null&gt;</code></td>
    <td>Resultado parseado del código (string plano o array de partes).</td>
  </tr>
  <tr>
    <td><code>isParsedResultArray</code></td>
    <td><code>ComputedRef&lt;boolean&gt;</code></td>
    <td>Indica si el resultado es una lista de partes (DataMatrix).</td>
  </tr>
  <tr>
    <td><code>detectType(code)</code></td>
    <td><code>string \| undefined</code></td>
    <td>Devuelve el tipo de código detectado: <code>EAN-13</code>, <code>EAN-14</code>, <code>DataMatrix</code> o <code>QR</code>.</td>
  </tr>
  <tr>
    <td><code>isQr</code></td>
    <td><code>Ref&lt;boolean&gt;</code></td>
    <td>Indica si el último código detectado es QR.</td>
  </tr>
  <tr>
    <td><code>checkInvisibleChars(event)</code></td>
    <td><code>string</code></td>
    <td>Devuelve "*" si el <code>charCode</code> del evento es 29.</td>
  </tr>
</table>

</div>

---

## 🧩 Tipos

```ts
interface CodePart {
  code: string;
  value: string;
  name: string;
  description: string;
}
```

---

## 🏷️ Códigos soportados (GS1 AIs)

| Código | Descripción                  | Longitud fija |
|--------|------------------------------|---------------|
| `01`   | GTIN                         | ✅ 16          |
| `10`   | Lote                         | ❌ variable    |
| `11`   | Fecha de producción (YYMMDD) | ✅ 8           |
| `17`   | Fecha de caducidad (YYMMDD)  | ✅ 8           |
| `21`   | Número de serie              | ❌ variable    |
| `712`  | Código nacional (NPC)        | ❌ variable    |

---

## 🧪 Ejemplo de integración con input de escáner

```vue
<template>
  <input
    @keypress="(e) => inputBuffer += checkInvisibleChars(e)"
    @keydown.enter.prevent="handleInput(inputBuffer)"
    v-model="inputBuffer"
  />
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useCodeParser } from "vue-code-parser";

const inputBuffer = ref("");
const { handleInput, checkInvisibleChars, parsedResult } = useCodeParser();
</script>
```

---

## 📃 Licencia

[MIT](LICENSE) © Christian

---

## 🤝 Contribuir

¡Pull requests y feedback son bienvenidos! Si encuentras un código no compatible, puedes abrir un issue o PR con los nuevos GS1 AI.
