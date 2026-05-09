import "leaflet";

declare module "leaflet" {
  interface Map {
    pm: {
      addControls(options: Record<string, unknown>): void;
      removeControls(): void;
      enableDraw(shape: string, options?: Record<string, unknown>): void;
      disableDraw(): void;
    };
  }
}
