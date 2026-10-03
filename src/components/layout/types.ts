export type NavProduct = {
  slug: string;
  name: string;
  industryName: string;
  icon: string;
  color: string;
};
export type NavCategory = { slug: string; name: string; products: NavProduct[] };
export type NavLink = { label: string; href: string };
