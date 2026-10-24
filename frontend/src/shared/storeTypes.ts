import {
  BookOpen,
  Cookie,
  Hammer,
  Pill,
  Scissors,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sprout,
  Stethoscope,
  Store,
  UtensilsCrossed,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type StoreType =
  | "GENERAL_STORE" | "MARKET_STALL" | "SUPERMARKET" | "RESTAURANT"
  | "BAKERY" | "PHARMACY" | "CLINIC" | "BEAUTY" | "FASHION"
  | "ELECTRONICS" | "HARDWARE" | "AUTO" | "AGRO" | "BOOKS"
  | "SERVICES" | "OTHER";

export const STORE_TYPES: {
  value: StoreType;
  label: string;
  hint: string;
  Icon: LucideIcon;
}[] = [
  { value: "GENERAL_STORE", label: "Loja", hint: "Comércio geral", Icon: ShoppingBag },
  { value: "MARKET_STALL", label: "Banca", hint: "Banca ou mercado", Icon: Store },
  { value: "SUPERMARKET", label: "Supermercado", hint: "Mercearia e alimentação", Icon: ShoppingCart },
  { value: "RESTAURANT", label: "Restaurante", hint: "Café, lanchonete, takeaway", Icon: UtensilsCrossed },
  { value: "BAKERY", label: "Padaria", hint: "Pastelaria e doçaria", Icon: Cookie },
  { value: "PHARMACY", label: "Farmácia", hint: "Medicamentos e saúde", Icon: Pill },
  { value: "CLINIC", label: "Clínica", hint: "Consultório e saúde", Icon: Stethoscope },
  { value: "BEAUTY", label: "Beleza", hint: "Salão, barbearia, estética", Icon: Scissors },
  { value: "FASHION", label: "Moda", hint: "Roupa, calçado, acessórios", Icon: Shirt },
  { value: "ELECTRONICS", label: "Eletrónica", hint: "Telemóveis e informática", Icon: Smartphone },
  { value: "HARDWARE", label: "Construção", hint: "Ferragens e materiais", Icon: Hammer },
  { value: "AUTO", label: "Automóvel", hint: "Peças e oficina", Icon: Wrench },
  { value: "AGRO", label: "Agricultura", hint: "Produtos agrícolas", Icon: Sprout },
  { value: "BOOKS", label: "Livraria", hint: "Livros e papelaria", Icon: BookOpen },
  { value: "SERVICES", label: "Serviços", hint: "Prestação de serviços", Icon: Wrench },
  { value: "OTHER", label: "Outro", hint: "Outro tipo", Icon: Store },
];

export function getStoreType(value?: string | null) {
  return STORE_TYPES.find(item => item.value === value) ?? STORE_TYPES[0];
}