import { Baloo_2 } from 'next/font/google'

const police = Baloo_2({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-police',
})
export const COLORS = {
  main: '#D47950',
  secondary: '#6D8775',
  third: '#C8DAD3',
  police: police.style.fontFamily
}