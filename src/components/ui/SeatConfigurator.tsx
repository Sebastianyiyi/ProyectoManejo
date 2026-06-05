/**
 * SeatConfigurator.tsx
 * Configurador de asientos para buses: 1 o 2 pisos, cantidad de asientos por piso,
 * visualización tipo plano de bus.
 */

import { useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layers, Bus, RotateCcw } from "lucide-react";

// ─────────────────────────────────────────────
//  Tipos
// ─────────────────────────────────────────────

export interface AsientoConfig {
  numero: number;
  fila: number;
  columna: number;
  piso: 1 | 2;
  activo: boolean;
}

export interface SeatConfiguratorValue {
  doble_piso: boolean;
  asientos_piso1: number; // cantidad total de asientos en piso 1
  asientos_piso2: number; // cantidad total de asientos en piso 2 (0 si un piso)
  asientos: AsientoConfig[];
}

interface Props {
  value: SeatConfiguratorValue;
  onChange: (v: SeatConfiguratorValue) => void;
}

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

const COLUMNAS = 4; // 2 izq + 2 der — diseño estándar de bus interprovincial

function generarAsientosPiso(
  piso: 1 | 2,
  cantidad: number,
  offsetNumero: number
): AsientoConfig[] {
  const filas = Math.ceil(cantidad / COLUMNAS);
  const seats: AsientoConfig[] = [];
  let counter = 0;
  for (let f = 1; f <= filas; f++) {
    for (let c = 1; c <= COLUMNAS; c++) {
      if (counter >= cantidad) break;
      counter++;
      seats.push({
        numero: offsetNumero + counter - 1,
        fila: f,
        columna: c,
        piso,
        activo: true,
      });
    }
  }
  return seats;
}

function recalcularAsientos(cfg: SeatConfiguratorValue): AsientoConfig[] {
  const p1 = generarAsientosPiso(1, cfg.asientos_piso1, 1);
  if (!cfg.doble_piso) return p1;
  const p2 = generarAsientosPiso(2, cfg.asientos_piso2, cfg.asientos_piso1 + 1);
  return [...p1, ...p2];
}

// ─────────────────────────────────────────────
//  Sub-componente: plano visual de un piso
// ─────────────────────────────────────────────

function FloorPlan({
  piso,
  asientos,
}: {
  piso: 1 | 2;
  asientos: AsientoConfig[];
}) {
  if (asientos.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-6">
        Asigna al menos 1 asiento para ver el plano.
      </p>
    );
  }

  const filas = Math.ceil(asientos.length / COLUMNAS);

  return (
    <div className="overflow-x-auto pb-2">
      <div className="inline-block min-w-max">
        {/* Etiqueta frente */}
        <div className="flex items-center justify-center mb-3 gap-2">
          <div className="h-px w-12 bg-border" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2">
            {piso === 1 ? "🚌 Frente — Piso 1" : "🏢 Frente — Piso 2"}
          </span>
          <div className="h-px w-12 bg-border" />
        </div>

        {/* Cuerpo del bus */}
        <div className="rounded-2xl border-2 border-border bg-card px-5 pt-4 pb-5 shadow-sm">
          {/* Chofer */}
          <div className="flex justify-end mb-4">
            <div className="flex items-center gap-1.5 rounded-xl border border-dashed border-muted-foreground/30 px-3 py-1.5 text-[11px] text-muted-foreground">
              🧑‍✈️ Chofer
            </div>
          </div>

          {/* Grid de asientos */}
          <div className="space-y-2">
            {Array.from({ length: filas }, (_, fi) => {
              const filaNum = fi + 1;
              const seatsInFila = asientos.filter((s) => s.fila === filaNum);
              const izq = seatsInFila.filter((s) => s.columna <= 2);
              const der = seatsInFila.filter((s) => s.columna > 2);

              return (
                <div key={filaNum} className="flex items-center gap-2">
                  {/* Número de fila */}
                  <span className="text-[10px] text-muted-foreground/60 w-4 text-right shrink-0 select-none">
                    {filaNum}
                  </span>

                  {/* Asientos izquierdos */}
                  <div className="flex gap-1.5">
                    {izq.map((seat) => (
                      <div
                        key={seat.numero}
                        title={`Asiento ${seat.numero}`}
                        className="w-9 h-10 rounded-t-2xl rounded-b-sm border-2 border-primary/40 bg-primary/10 text-[10px] font-bold text-primary flex items-center justify-center select-none"
                      >
                        {seat.numero}
                      </div>
                    ))}
                  </div>

                  {/* Pasillo */}
                  <div className="w-6 shrink-0" />

                  {/* Asientos derechos */}
                  <div className="flex gap-1.5">
                    {der.map((seat) => (
                      <div
                        key={seat.numero}
                        title={`Asiento ${seat.numero}`}
                        className="w-9 h-10 rounded-t-2xl rounded-b-sm border-2 border-primary/40 bg-primary/10 text-[10px] font-bold text-primary flex items-center justify-center select-none"
                      >
                        {seat.numero}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Parte trasera */}
        <div className="flex justify-center mt-1">
          <span className="text-[10px] text-muted-foreground/50 select-none">▬ Parte trasera</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Componente principal
// ─────────────────────────────────────────────

export function SeatConfigurator({ value, onChange }: Props) {
  const asientosPiso1 = value.asientos.filter((s) => s.piso === 1);
  const asientosPiso2 = value.asientos.filter((s) => s.piso === 2);
  const totalCapacidad = value.asientos_piso1 + (value.doble_piso ? value.asientos_piso2 : 0);

  const handleToggleDoble = (esDoble: boolean) => {
    const newVal: SeatConfiguratorValue = {
      ...value,
      doble_piso: esDoble,
    };
    newVal.asientos = recalcularAsientos(newVal);
    onChange(newVal);
  };

  const handleCantidadPiso = useCallback(
    (piso: 1 | 2, cantidad: number) => {
      const safe = Math.max(1, Math.min(60, isNaN(cantidad) ? 1 : cantidad));
      const newVal: SeatConfiguratorValue = {
        ...value,
        asientos_piso1: piso === 1 ? safe : value.asientos_piso1,
        asientos_piso2: piso === 2 ? safe : value.asientos_piso2,
      };
      newVal.asientos = recalcularAsientos(newVal);
      onChange(newVal);
    },
    [value, onChange]
  );

  const handleReset = () => {
    const newVal: SeatConfiguratorValue = {
      ...value,
      asientos_piso1: 40,
      asientos_piso2: value.doble_piso ? 30 : 0,
    };
    newVal.asientos = recalcularAsientos(newVal);
    onChange(newVal);
  };

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bus size={16} className="text-primary" />
          <Label className="text-sm font-semibold">Configuración de asientos</Label>
          <Badge variant="outline" className="text-xs tabular-nums">
            {totalCapacidad} asientos
          </Badge>
        </div>
        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleReset}>
          <RotateCcw size={11} />
          Reiniciar
        </Button>
      </div>

      {/* ── Selector de pisos ── */}
      <div className="flex items-center gap-3 p-4 rounded-xl border bg-muted/30">
        <Layers size={18} className="text-muted-foreground shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">Número de pisos</p>
          <p className="text-xs text-muted-foreground">¿El bus tiene uno o dos pisos?</p>
        </div>
        <div className="flex rounded-lg border overflow-hidden">
          <button
            type="button"
            onClick={() => handleToggleDoble(false)}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${
              !value.doble_piso
                ? "bg-primary text-primary-foreground"
                : "bg-transparent text-muted-foreground hover:bg-muted"
            }`}
          >
            1 piso
          </button>
          <button
            type="button"
            onClick={() => handleToggleDoble(true)}
            className={`px-4 py-1.5 text-sm font-medium transition-colors border-l ${
              value.doble_piso
                ? "bg-primary text-primary-foreground"
                : "bg-transparent text-muted-foreground hover:bg-muted"
            }`}
          >
            2 pisos
          </button>
        </div>
      </div>

      {/* ── Cantidad de asientos por piso ── */}
      <div className={`grid gap-4 ${value.doble_piso ? "grid-cols-2" : "grid-cols-1 max-w-xs"}`}>
        <div className="space-y-1.5 p-4 rounded-xl border bg-muted/20">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {value.doble_piso ? "Piso 1 — Asientos" : "Cantidad de asientos"}
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={60}
              value={value.asientos_piso1}
              onChange={(e) => handleCantidadPiso(1, parseInt(e.target.value))}
              className="w-24 text-center font-mono text-base"
            />
            <span className="text-xs text-muted-foreground">asientos</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {Math.ceil(value.asientos_piso1 / COLUMNAS)} filas × {COLUMNAS} columnas
          </p>
        </div>

        {value.doble_piso && (
          <div className="space-y-1.5 p-4 rounded-xl border bg-muted/20">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Piso 2 — Asientos
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={60}
                value={value.asientos_piso2}
                onChange={(e) => handleCantidadPiso(2, parseInt(e.target.value))}
                className="w-24 text-center font-mono text-base"
              />
              <span className="text-xs text-muted-foreground">asientos</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {Math.ceil(value.asientos_piso2 / COLUMNAS)} filas × {COLUMNAS} columnas
            </p>
          </div>
        )}
      </div>

      {/* ── Vista previa del plano ── */}
      {value.doble_piso ? (
        <Tabs defaultValue="piso1">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="piso1" className="gap-1.5 text-sm">
              🚌 Piso 1
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">
                {value.asientos_piso1}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="piso2" className="gap-1.5 text-sm">
              🏢 Piso 2
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">
                {value.asientos_piso2}
              </Badge>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="piso1" className="mt-3">
            <FloorPlan piso={1} asientos={asientosPiso1} />
          </TabsContent>
          <TabsContent value="piso2" className="mt-3">
            <FloorPlan piso={2} asientos={asientosPiso2} />
          </TabsContent>
        </Tabs>
      ) : (
        <FloorPlan piso={1} asientos={asientosPiso1} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Valor por defecto exportado
// ─────────────────────────────────────────────

export function defaultSeatConfig(): SeatConfiguratorValue {
  const base: SeatConfiguratorValue = {
    doble_piso: false,
    asientos_piso1: 40,
    asientos_piso2: 0,
    asientos: [],
  };
  base.asientos = base.asientos_piso1 > 0
    ? Array.from({ length: base.asientos_piso1 }, (_, i) => ({
        numero: i + 1,
        fila: Math.floor(i / 4) + 1,
        columna: (i % 4) + 1,
        piso: 1 as const,
        activo: true,
      }))
    : [];
  return base;
}
