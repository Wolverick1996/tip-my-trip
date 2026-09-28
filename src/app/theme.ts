import { createTheme, type MantineColorsTuple } from "@mantine/core"

const lagoon: MantineColorsTuple = [
  "#EAF9FA",
  "#D4F1F4",
  "#B5E7EC",
  "#8CD9E1",
  "#63CBD6",
  "#3CBBC9",
  "#29B2C5",
  "#218F9E",
  "#176B77",
  "#10464D",
]

const mint: MantineColorsTuple = [
  "#EFF9F3",
  "#D9F1E3",
  "#BCE6CF",
  "#9ADBB8",
  "#7BD0A2",
  "#69C695",
  "#5EBF8C",
  "#49996F",
  "#347352",
  "#204D37",
]

const strawberry: MantineColorsTuple = [
  "#FFF1F3",
  "#FEE0E5",
  "#FCC7D0",
  "#F9AEBB",
  "#F68FA2",
  "#F57990",
  "#F36582",
  "#D54F6A",
  "#AE3C54",
  "#76283A",
]

const orange: MantineColorsTuple = [
  "#FFF3EE",
  "#FFE3D9",
  "#FFCDBD",
  "#FFB29A",
  "#FF9474",
  "#FC7D59",
  "#FA6B3F",
  "#DA5832",
  "#B34425",
  "#78301C",
]

const coconut: MantineColorsTuple = [
  "#FFFBED",
  "#FFF5D5",
  "#FFEDBA",
  "#FCE39A",
  "#FBDC78",
  "#F9D667",
  "#FAD05A",
  "#D6AF48",
  "#AD8D37",
  "#746023",
]

const cream: MantineColorsTuple = [
  "#FDFBF7",
  "#FAF8F3",
  "#F5F2EB",
  "#EAE6DC",
  "#DCD7CC",
  "#C9C2B4",
  "#786F62",
  "#655C50",
  "#50483D",
  "#342F28",
]

export const theme = createTheme({
  black: "#161616",
  primaryColor: "lagoon",
  primaryShade: 8,
  defaultRadius: "lg",
  colors: {
    lagoon,
    mint,
    strawberry,
    orange,
    coconut,
    cream,
  },
  fontFamily: "var(--font-google-sans)",
  fontSizes: { sm: "0.9375rem" },
  headings: {
    fontFamily: "var(--font-lora)",
    sizes: {
      h1: { fontSize: "2.25rem", lineHeight: "1.2", fontWeight: "700" },
      h2: { fontSize: "1.875rem", lineHeight: "1.25", fontWeight: "700" },
      h3: { fontSize: "1.5rem", lineHeight: "1.3", fontWeight: "600" },
      h4: { fontSize: "1.25rem", lineHeight: "1.35", fontWeight: "600" },
      h5: { fontSize: "1.125rem", lineHeight: "1.4", fontWeight: "600" },
      h6: { fontSize: "1rem", lineHeight: "1.4", fontWeight: "600" },
    },
  },
  components: {
    InputLabel: { defaultProps: { fw: 500 } },
    InputWrapper: { styles: { label: { marginBottom: 5 } } },
    ModalTitle: { defaultProps: { fw: 600 } },
  },
})
