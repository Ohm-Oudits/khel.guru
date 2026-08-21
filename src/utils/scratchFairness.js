export const SCRATCH_FAIRNESS_FORMULA =
  "HMAC_SHA256(serverSeed, clientSeed:nonce:round) → 18 floats. Cells are left-to-right, top-to-bottom. Diamond i = palette[floor(u_i × 5)]. Balloon i = palette[floor(u_{9+i} × 5)]. Unrevealed diamonds are withheld. Rotate the scratch seed pair to replay the 9 diamond colors.";
