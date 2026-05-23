export function getSoilClassification(clay: number, silt: number, sand: number): string {
  const total = clay + silt + sand;
  if (Math.abs(total - 100) > 1.5) {
    return `Invalide (Somme: ${total.toFixed(1)}%)`;
  }
  
  if (clay >= 40) {
    if (sand >= 45) return "Argile Sableuse (Sandy Clay)";
    if (silt >= 40) return "Argile Limoneuse (Silty Clay)";
    return "Sol Argileux (Clay)";
  }
  
  if (clay >= 27) {
    if (sand >= 45) return "Loam Argilo-Sableux (Sandy Clay Loam)";
    if (silt >= 40) return "Loam Argilo-Limoneux (Silty Clay Loam)";
    return "Loam Argileux (Clay Loam)";
  }
  
  if (sand >= 52) {
    if (clay >= 20) return "Loam Argilo-Sableux (Sandy Clay Loam)";
    if (sand >= 85) {
      if (clay <= 10) return "Sol Sableux (Sand)";
      return "Sable Limoneux (Loamy Sand)";
    }
    if (sand >= 70 && clay <= 15) return "Sable Limoneux (Loamy Sand)";
    return "Limon Sableux (Sandy Loam)";
  }
  
  if (silt >= 80 && clay <= 12) return "Limon Pur (Silt)";
  if (silt >= 50) return "Limon (Silt Loam)";
  return "Sol Franc (Loam)";
}
