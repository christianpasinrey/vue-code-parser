// src/useCodeParser.ts
import { ref, computed } from "vue";
function useCodeParser() {
  const parsedResult = ref(null);
  const buffer = ref("");
  let bufferTimeout = null;
  const isQr = ref(false);
  const CODE_PARTS = [
    { name: "Global Trade Item Number", description: "GTIN", code: "01", length: 16 },
    { name: "Batch or lot number", description: "LOTE", code: "10", length: null },
    { name: "Production date (YYMMDD)", description: "FECHA DE PRODUCCI\xD3N", code: "11", length: 8 },
    { name: "Expiration date (YYMMDD)", description: "FECHA DE CACUCIDAD", code: "17", length: 8 },
    { name: "Serial number", description: "SERIAL", code: "21", length: null },
    { name: "National product code", description: "NPC", code: "712", length: null }
  ];
  const DATAMATRIX_FNC1 = ["]C1", "]e0", "]d1", "]d2", "]q3"];
  const QR_FNC1 = ["]Q1", "]Q2", "]Q3", "]Q4"];
  const EAN_FNC1 = ["]E0"];
  const detectType = (code) => {
    if (isValidEan13(code))
      return "EAN-13";
    if (isValidEan14(code))
      return "EAN-14";
    if (isValidDataMatrix(code))
      return "DataMatrix";
    if (code.startsWith("]Q"))
      return "QR";
  };
  const isValidEan13 = (code) => {
    if (!EAN_FNC1.includes(code.slice(0, 3)))
      return false;
    code = code.slice(3);
    if (code.length !== 13)
      return false;
    return calculateCheckDigit(code.slice(0, 12)) === parseInt(code[12]);
  };
  const isValidEan14 = (code) => {
    if (!EAN_FNC1.includes(code.slice(0, 3)))
      return false;
    code = code.slice(3);
    if (code.length !== 14)
      return false;
    return calculateCheckDigit(code.slice(0, 13)) === parseInt(code[13]);
  };
  const isValidDataMatrix = (code) => {
    return DATAMATRIX_FNC1.includes(code.slice(0, 3));
  };
  const handleInput = (newInput) => {
    return new Promise((resolve, reject) => {
      if (!newInput?.trim()) {
        reject("Input inv\xE1lido");
        return;
      }
      buffer.value = newInput;
      if (bufferTimeout)
        clearTimeout(bufferTimeout);
      bufferTimeout = window.setTimeout(async () => {
        try {
          const result = await handleParse();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, 300);
    });
  };
  const handleParse = async () => {
    if (!buffer.value?.trim())
      return null;
    const result = await getParsedCode(buffer.value);
    parsedResult.value = result;
    return result;
  };
  const getParsedCode = async (code) => {
    isQr.value = false;
    switch (detectType(code)) {
      case "EAN-13":
        return parseEan13(code);
      case "EAN-14":
        return parseEan14(code);
      case "DataMatrix":
        return createCodeDataMatrix(await getParsedDataMatrix(code));
      case "QR":
        isQr.value = true;
        return code.slice(3);
      default:
        return code;
    }
  };
  const createCodeDataMatrix = (parts) => {
    return parts.map((part) => {
      const codePart = CODE_PARTS.find((cp) => cp.code === part.code);
      return {
        code: part.code,
        value: part.value,
        name: codePart?.name ?? "Unknown",
        description: codePart?.description ?? "Unknown"
      };
    });
  };
  const getParsedDataMatrix = async (code) => {
    let string = code.slice(3);
    const codeParts = [];
    let iteration = 0;
    const maxIterations = 1e3;
    while (string.length > 0 && iteration++ < maxIterations) {
      let currentPart = null;
      let codeLength = 0;
      for (const part of CODE_PARTS) {
        if (string.startsWith(part.code)) {
          currentPart = part;
          codeLength = part.code.length;
          break;
        }
      }
      if (currentPart) {
        let length;
        if (currentPart.length == null) {
          const nextPlus = string.indexOf("+", codeLength);
          length = nextPlus === -1 ? string.length : nextPlus + 1;
        } else {
          length = codeLength + currentPart.length - currentPart.code.length;
        }
        let value = string.slice(codeLength, length).replace(/\+$/, "");
        codeParts.push({
          code: currentPart.code,
          value,
          name: currentPart.name,
          description: currentPart.description
        });
        string = string.slice(length);
      } else {
        const unknownCode = string.slice(0, 2);
        const nextPlus = string.indexOf("+", 2);
        const length = nextPlus === -1 ? string.length : nextPlus + 1;
        let value = string.slice(2, length).replace(/\+$/, "");
        codeParts.push({
          code: unknownCode,
          value,
          name: "Unknown",
          description: "Unknown"
        });
        string = string.slice(length);
      }
    }
    if (iteration >= maxIterations) {
      throw new Error("Maximum iteration limit reached.");
    }
    return codeParts;
  };
  const parseEan13 = (code) => code.replace("]E0", "");
  const parseEan14 = (code) => code.replace("]E0", "");
  const calculateCheckDigit = (code) => {
    let sum = 0;
    for (let i = 0; i < code.length; i++) {
      sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
    }
    return (10 - sum % 10) % 10;
  };
  const checkInvisibleChars = (e) => {
    return e.charCode === 29 ? "*" : e.key;
  };
  const isParsedResultArray = computed(() => Array.isArray(parsedResult.value));
  return {
    handleInput,
    checkInvisibleChars,
    parsedResult,
    isParsedResultArray,
    detectType,
    isQr
  };
}
export {
  useCodeParser
};
