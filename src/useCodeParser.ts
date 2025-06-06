import { ref, computed } from "vue";

export interface CodePart {
  code: string;
  value: string;
  name: string;
  description: string;
}

const CODE_PARTS: CodePart[] = [
  { name: "Global Trade Item Number", description: "GTIN", code: "01", length: 16 },
  { name: "Batch or lot number", description: "LOTE", code: "10", length: null },
  { name: "Production date (YYMMDD)", description: "FECHA DE PRODUCCIÓN", code: "11", length: 8 },
  { name: "Expiration date (YYMMDD)", description: "FECHA DE CACUCIDAD", code: "17", length: 8 },
  { name: "Serial number", description: "SERIAL", code: "21", length: null },
  { name: "National product code", description: "NPC", code: "712", length: null },
];

const DATAMATRIX_FNC1 = ["]C1", "]e0", "]d1", "]d2", "]q3"];
const QR_FNC1 = ["]Q1", "]Q2", "]Q3", "]Q4"];
const EAN_FNC1 = ["]E0"];

export function useCodeParser() {
  const parsedResult = ref<string | CodePart[] | null>(null);
  const buffer = ref("");
  const isQr = ref(false);
  let bufferTimeout: number | null = null;

  const detectType = (code: string): string | undefined => {
    if (isValidEan13(code)) return "EAN-13";
    if (isValidEan14(code)) return "EAN-14";
    if (isValidDataMatrix(code)) return "DataMatrix";
    if (code.startsWith("]Q")) return "QR";
  };

  const isValidEan13 = (code: string): boolean => {
    if (!EAN_FNC1.includes(code.slice(0, 3))) return false;
    code = code.slice(3);
    if (code.length !== 13) return false;
    const expected = calculateCheckDigit(code.slice(0, 12));
    const actual = parseInt(code[12]);
    return expected === actual;
  };

  const isValidEan14 = (code: string): boolean => {
    if (!EAN_FNC1.includes(code.slice(0, 3))) return false;
    code = code.slice(3);
    if (code.length !== 14) return false;
    const expected = calculateCheckDigit(code.slice(0, 13));
    const actual = parseInt(code[13]);
    return expected === actual;
  };

  const isValidDataMatrix = (code: string): boolean => {
    return DATAMATRIX_FNC1.includes(code.slice(0, 3));
  };

  const handleInput = (newInput: string): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      if (!newInput?.trim()) {
        reject("Input vacío o inválido");
        return;
      }

      buffer.value = newInput;

      if (bufferTimeout) clearTimeout(bufferTimeout);

      bufferTimeout = setTimeout(() => {
        getParsedCode(buffer.value)
          .then(result => {
            parsedResult.value = result;
            resolve(result);
          })
          .catch(reject);
      }, 300);
    });
  };

  const getParsedCode = async (code: string): Promise<string | CodePart[]> => {
    isQr.value = false;

    switch (detectType(code)) {
      case "EAN-13":
        return code.replace("]E0", "");
      case "EAN-14":
        return code.replace("]E0", "");
      case "DataMatrix":
        return createCodeDataMatrix(await parseDataMatrix(code));
      case "QR":
        isQr.value = true;
        return code.slice(3);
      default:
        return code;
    }
  };

  const parseDataMatrix = async (code: string): Promise<CodePart[]> => {
    let str = code.slice(3);
    const result: CodePart[] = [];
    let maxIterations = 1000;
    let iteration = 0;

    while (str.length && iteration++ < maxIterations) {
      let match = CODE_PARTS.find(p => str.startsWith(p.code));
      let codeLength = match ? match.code.length : 2;
      let length: number;

      if (match) {
        length = match.length ?? str.indexOf("+", codeLength);
        if (length === -1) length = str.length;
        else length += 1;
      } else {
        length = str.indexOf("+", 2);
        if (length === -1) length = str.length;
        else length += 1;
      }

      const raw = str.slice(0, length);
      const code = raw.slice(0, codeLength);
      const value = raw.slice(codeLength).replace(/\+$/, "");

      result.push({
        code,
        value,
        name: match?.name || "Unknown",
        description: match?.description || "Unknown",
      });

      str = str.slice(length);
    }

    if (iteration >= maxIterations) {
      throw new Error("Maximum iteration limit reached.");
    }

    return result;
  };

  const calculateCheckDigit = (code: string): number => {
    let sum = 0;
    for (let i = 0; i < code.length; i++) {
      sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
    }
    return (10 - (sum % 10)) % 10;
  };

  const checkInvisibleChars = (e: KeyboardEvent): string => {
    return e.charCode === 29 ? "*" : e.key;
  };

  const isParsedResultArray = computed(() => Array.isArray(parsedResult.value));

  return {
    handleInput,
    parsedResult,
    isParsedResultArray,
    detectType,
    isQr,
    checkInvisibleChars,
  };
}
