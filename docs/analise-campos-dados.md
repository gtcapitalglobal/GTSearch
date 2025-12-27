# 📊 Análise de Campos de Dados - GT Lands Dashboard

## 🎯 Objetivo
Identificar quais campos podem ser eliminados da interface porque as APIs (Google Maps, Zillow, Realtor.com) não fornecem esses dados.

---

## 📥 Campos Disponíveis no CSV

### Dados do CSV (37 campos):
1. Parcel Fair Report
2. Parcel Id
3. **Parcel Number** ✅
4. Padded Parcel Number
5. Raw Parcel Number
6. **Next Auction** ✅
7. Name
8. **County** ✅
9. Availability
10. Tax Sale Year
11. Delinquent Year
12. **Amount Due** ✅
13. **CS (Case)** ✅
14. **Acres** ✅
15. Market 15%
16. **Total Value** ✅
17. **Land (Value)** ✅
18. **Improvements** ✅
19. Assessed Value
20. **Parcel Type** ✅
21. **Status** ✅
22. **Occupancy** ✅
23. Neighborhood
24. **Address** ✅
25. City
26. State
27. Zip
28. Mun. Code
29. **Owner Name** ✅
30. Owner Address
31. Owner City
32. Owner State
33. Owner Zip
34. **Opportunity Zone** ✅
35. **Square Feet** ✅
36. **Coordinates** ✅
37. **Legal Description** ✅

---

## 🖥️ Campos Exibidos na Interface (analysis.html)

### **Seção 1: Informações da Propriedade**
| Campo | Fonte | Disponível? |
|-------|-------|-------------|
| Auction Date | CSV | ✅ SIM |
| Parcel # | CSV | ✅ SIM |
| Address | CSV | ✅ SIM |
| Acres | CSV | ✅ SIM |
| Square Feet | CSV | ✅ SIM |
| Owner | CSV | ✅ SIM |
| Amount Due | CSV | ✅ SIM |
| County | CSV | ✅ SIM |
| Type | CSV | ✅ SIM |
| **Zoneamento** | ❌ **NÃO DISPONÍVEL** | ❌ NÃO |
| Coordinates | CSV | ✅ SIM |
| FEMA Flood Risk | FEMA API | ✅ SIM |
| Legal Description | CSV | ✅ SIM |

### **Seção 2: Detalhes Adicionais**
| Campo | Fonte | Disponível? |
|-------|-------|-------------|
| Parcel Number | CSV | ✅ SIM |
| Case (CS) | CSV | ✅ SIM |
| **PIN/PPIN** | CSV | ⚠️ **VERIFICAR** |
| **Certificate #** | CSV | ⚠️ **VERIFICAR** |
| **Account #** | CSV | ⚠️ **VERIFICAR** |
| Land Value | CSV | ✅ SIM |
| Improvements | CSV | ✅ SIM |
| Total Value | CSV | ✅ SIM |
| Opportunity Zone | CSV | ✅ SIM |
| Occupancy | CSV | ✅ SIM |
| Status | CSV | ✅ SIM |
| Tax Years | CSV | ⚠️ **VERIFICAR** |

### **Seção 3: Contact Information**
| Campo | Fonte | Disponível? |
|-------|-------|-------------|
| Contact Info | CSV (Owner Address) | ✅ SIM |

---

## 🚫 Campos que NÃO podem ser obtidos via API

### **Google Maps API:**
- ❌ **Zoneamento** (precisa de API específica ou scraping de sites do governo)
- ❌ **PIN/PPIN** (dado específico do condado)
- ❌ **Certificate #** (dado específico do tax lien)
- ❌ **Account #** (dado específico do condado)
- ❌ **Tax Years** (dado específico do condado)

### **Zillow/Realtor.com API:**
- ❌ **Fotos** (APIs pagas ou scraping - complexo)
- ❌ **Preço de mercado** (APIs pagas)
- ❌ **Informações de venda** (APIs pagas)

---

## ✅ Campos que PODEM ser obtidos via API

### **Google Maps API (GRÁTIS):**
- ✅ Coordenadas (já tem no CSV)
- ✅ Endereço formatado
- ✅ Street View (imagem)
- ✅ Mapa Satélite (imagem)
- ✅ Mapa Terreno (imagem)
- ✅ Elevação

### **FEMA API (GRÁTIS):**
- ✅ Flood Zone
- ✅ Flood Risk Level
- ✅ Insurance Requirements

---

## 🎯 Recomendações

### **MANTER (Dados disponíveis no CSV):**
1. ✅ Auction Date
2. ✅ Parcel #
3. ✅ Address
4. ✅ Acres
5. ✅ Square Feet
6. ✅ Owner
7. ✅ Amount Due
8. ✅ County
9. ✅ Type
10. ✅ Coordinates
11. ✅ FEMA Flood Risk
12. ✅ Legal Description
13. ✅ Land Value
14. ✅ Improvements
15. ✅ Total Value
16. ✅ Opportunity Zone
17. ✅ Occupancy
18. ✅ Status

### **REMOVER ou MARCAR COMO "Não Disponível":**
1. ❌ **Zoneamento** - Não disponível via Google Maps
2. ❌ **PIN/PPIN** - Verificar se existe no CSV
3. ❌ **Certificate #** - Verificar se existe no CSV
4. ❌ **Account #** - Verificar se existe no CSV
5. ❌ **Tax Years** - Verificar se existe no CSV
6. ❌ **Zillow Photos** - API paga ou scraping complexo
7. ❌ **Realtor Photos** - API paga ou scraping complexo

### **ADICIONAR (Fácil de obter):**
1. ✅ **Distância até a costa** (cálculo simples com coordenadas)
2. ✅ **Cidade mais próxima** (Google Geocoding API)
3. ✅ **Elevação do terreno** (Google Elevation API)

---

## 🔍 Próximos Passos

1. **Verificar no CSV** se existem colunas para:
   - PIN/PPIN
   - Certificate #
   - Account #
   - Tax Years

2. **Decidir:**
   - Remover campos que não existem no CSV?
   - Ou deixar como "Não disponível"?

3. **Implementar:**
   - Distância até a costa (cálculo simples)
   - Elevação do terreno (Google Elevation API)

---

## 💡 Sugestão Final

**Campos para REMOVER da interface:**
- Zoneamento (não disponível)
- Zillow Photos (API paga)
- Realtor Photos (API paga)

**Campos para VERIFICAR no CSV:**
- PIN/PPIN
- Certificate #
- Account #
- Tax Years

**Se não existirem no CSV, REMOVER da interface.**
