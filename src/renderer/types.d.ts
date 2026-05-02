declare global {
  interface Window {
    electron: {
      leerDirectorios: (rutaBase: string) => Promise<any[]>;
      seleccionarDirectorio: () => Promise<string>;
      cerrarApp: () => void;
    };
  }
}

export {};
