import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bus, MapPin, ShieldCheck, QrCode, CreditCard, Users } from "lucide-react";

export default function Index() {
  return (
    <div>
      {/* TODO: Hero — Buscador*/}

      {/* Beneficios */}
      <section className="container py-16 md:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">¿Por qué BusEcuador?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Una experiencia de compra moderna pensada para pasajeros y cooperativas.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: MapPin, title: "Selección visual de asiento", desc: "Elige tu lugar exacto en un mapa interactivo del bus." },
            { icon: ShieldCheck, title: "Pago seguro con validación", desc: "Sube tu comprobante de transferencia y un oficinista lo valida." },
            { icon: QrCode, title: "Boleto digital con QR", desc: "Lleva tu boleto en el celular y aborda mostrando el QR." },
            { icon: CreditCard, title: "Descuentos legales", desc: "Aplicamos automáticamente menores, tercera edad y discapacidad." },
            { icon: Users, title: "Compra para varios", desc: "Adquiere varios asientos en una sola reserva." },
            { icon: Bus, title: "Cooperativas verificadas", desc: "Trabajamos con operadoras autorizadas por la ANT." },
          ].map((f, i) => (
            <Card key={i} className="p-6 hover:shadow-md transition-shadow">
              <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary grid place-items-center mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

       {/* CTA */}
      <section className="container pb-20">
        <Card className="p-8 md:p-12 text-center bg-primary text-primary-foreground border-0">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">¿Listo para tu próximo viaje?</h2>
          <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
            Crea tu cuenta gratis y empieza a reservar boletos en segundos.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" size="lg" asChild>
              <Link to="/auth?tab=signup">Crear cuenta</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              asChild
            >
              <Link to="/buscar">Buscar viajes</Link>
            </Button>
          </div>
        </Card>
      </section>

    </div>
  );
}