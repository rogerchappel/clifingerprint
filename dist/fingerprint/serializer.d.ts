import { Fingerprint, CompareResult } from "./types.js";
export declare function serializeFingerprint(fp: Fingerprint): string;
export declare function parseFingerprint(data: string): Fingerprint;
export declare function loadFingerprint(path: string): Fingerprint;
export declare function saveFingerprint(path: string, fp: Fingerprint): void;
export declare function formatDiffReport(result: CompareResult): string;
//# sourceMappingURL=serializer.d.ts.map