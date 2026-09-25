import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * `all-the-cities` legge un file binario relativo a `__dirname` al caricamento: va escluso dal bundle del server e richiesto direttamente da Node.
   * @prototype Serve solo finché il catalogo città è in memoria. Con un database sparirebbe.
   */
  serverExternalPackages: ["all-the-cities"],
};

export default nextConfig;
