import { Card } from "@/components/ui/card";
import { Bus, MapPin, ShieldCheck, QrCode, CreditCard, Users } from "lucide-react";
{/* SECCIÓN DE BENEFICIOS (Persona 5) */}
      <section className="container py-16 md:py-20">
        <div className="text-center mb-12">
          {/* Título y subtítulo centrado */}
          <h2 className="text-3xl md:text-4xl font-bold mb-3">¿Por qué BusEcuador?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Una experiencia de compra moderna pensada para pasajeros y cooperativas.
          </p>
        </div>

        {/* Grid de 3 columnas en desktop y 1 en móvil */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: MapPin, title: "Selección visual de asiento", desc: "Elige tu lugar exacto en un mapa interactivo del bus." },
            { icon: ShieldCheck, title: "Pago seguro con validación", desc: "Sube tu comprobante de transferencia y un oficinista lo valida." },
            { icon: QrCode, title: "Boleto digital con QR", desc: "Lleva tu boleto en el celular y aborda mostrando el QR." },
            { icon: CreditCard, title: "Descuentos legales", desc: "Aplicamos automáticamente menores, tercera edad y discapacidad." },
            { icon: Users, title: "Compra para varios", desc: "Adquiere varios asientos en una sola reserva." },
            { icon: Bus, title: "Cooperativas verificadas", desc: "Trabajamos con operadoras autorizadas por la ANT." },
          ].map((beneficio, index) => (
            <Card key={index} className="p-6 hover:shadow-md transition-shadow border-border/50">
              {/* Icono con fondo suave y color primary */}
              <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary grid place-items-center mb-4">
                <beneficio.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{beneficio.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {beneficio.desc}
              </p>
            </Card>
          ))}
        </div>
      </section>