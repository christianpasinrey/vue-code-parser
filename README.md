# 🎯 vue-code-parser

> 🧩 Composable for Vue 3 to detect, validate and parse barcodes (EAN-13, EAN-14), QR and DataMatrix (GS1).

This package allows you to work with scanned or typed inputs containing structured information such as **GTIN**, **LOT**, **DATE**, **SERIAL**, etc., including advanced parsing of GS1 codes.

---

## 🚀 Installation

```bash
npm install vue-code-parser
```

---

## 🧠 What does it do?

Detects the type of scanned code (EAN, QR, DataMatrix) and converts it into a readable object:

- ✅ EAN-13 and EAN-14 validation with check digit calculation
- ✅ DataMatrix parsing (with GS1 support and AIs like `01`, `10`, `17`, etc.)
- ✅ QR detection and payload extraction
- ✅ Debounced buffer to avoid repetitions from scanners
- ✅ Handling of invisible characters (such as `charCode === 29`)

---

## 🧰 Basic usage

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

// In some method:
handleInput(']d20112345678901234101725010110ABC123+')
  .then(() => {
    console.log(parsedResult.value);
  });
```

---

## 🧾 Expected result (DataMatrix GS1)

```ts
[
  { code: "01", value: "12345678901234", name: "Global Trade Item Number", description: "GTIN" },
  { code: "17", value: "250101", name: "Expiration date (YYMMDD)", description: "EXPIRATION DATE" },
  { code: "10", value: "ABC123", name: "Batch or lot number", description: "LOT" }
]
```

---

## 📦 Full API

<div align="center">

<table>
  <tr>
    <th>Property</th>
    <th>Type</th>
    <th>Description</th>
  </tr>
  <tr>
    <td><code>handleInput(code)</code></td>
    <td><code>Promise&lt;unknown&gt;</code></td>
    <td>Processes the scanned code with debounce.</td>
  </tr>
  <tr>
    <td><code>parsedResult</code></td>
    <td><code>Ref&lt;string | CodePart[] | null&gt;</code></td>
    <td>Parsed result of the code (plain string or array of parts).</td>
  </tr>
  <tr>
    <td><code>isParsedResultArray</code></td>
    <td><code>ComputedRef&lt;boolean&gt;</code></td>
    <td>Indicates if the result is a list of parts (DataMatrix).</td>
  </tr>
  <tr>
    <td><code>detectType(code)</code></td>
    <td><code>string | undefined</code></td>
    <td>Returns the detected code type: <code>EAN-13</code>, <code>EAN-14</code>, <code>DataMatrix</code> or <code>QR</code>.</td>
  </tr>
  <tr>
    <td><code>isQr</code></td>
    <td><code>Ref&lt;boolean&gt;</code></td>
    <td>Indicates if the last detected code is QR.</td>
  </tr>
  <tr>
    <td><code>checkInvisibleChars(event)</code></td>
    <td><code>string</code></td>
    <td>Returns "*" if the event's <code>charCode</code> is 29.</td>
  </tr>
</table>

</div>

---

## 🧩 Types

```ts
interface CodePart {
  code: string;
  value: string;
  name: string;
  description: string;
}
```

---

## 🏷️ Supported codes (GS1 AIs)

| Code  | Description                   | Fixed length |
|-------|-------------------------------|--------------|
| `01`  | GTIN                          | ✅ 16         |
| `10`  | Lot                           | ❌ variable   |
| `11`  | Production date (YYMMDD)      | ✅ 8          |
| `17`  | Expiration date (YYMMDD)      | ✅ 8          |
| `21`  | Serial number                 | ❌ variable   |
| `712` | National code (NPC)           | ❌ variable   |

---

## 🧪 Example integration with scanner input

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

## 📃 License

[MIT](LICENSE) © Christian

---

## 🤝 Contributing

Pull requests and feedback are welcome! If you find an unsupported code, you can open an issue or PR with the new GS1 AI.
