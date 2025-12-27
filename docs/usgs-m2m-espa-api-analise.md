# 🛰️ USGS M2M / ESPA API - Análise Completa

## 📊 O que é USGS ESPA API?

**ESPA (EROS Science Processing Architecture)** é uma API do USGS para:
- 🛰️ Baixar imagens de satélite Landsat
- 📦 Processar e customizar produtos
- 📥 Download automatizado de dados

**M2M (Machine to Machine)** é a API de autenticação e busca de cenas.

---

## 🔑 O Token que você conseguiu:

### **É um token de autenticação para:**
- ✅ Buscar cenas Landsat no catálogo USGS
- ✅ Fazer pedidos de processamento
- ✅ Baixar imagens processadas

### **Host da API:**
```
https://espa.cr.usgs.gov/api
```

---

## 🎯 O que você pode fazer com essa API:

### **1. Buscar Produtos Disponíveis:**
```
GET /available-products
```
- Ver quais produtos ESPA pode gerar para uma cena Landsat

### **2. Fazer Pedido de Processamento:**
```
POST /order
```
- Solicitar processamento de imagens
- Escolher projeção, reamostramento, formato

### **3. Verificar Status do Pedido:**
```
GET /item-status
```
- Ver quando processamento terminou
- Obter URL de download

---

## 🛰️ Dados Disponíveis:

### **Satélites:**
- ✅ **Landsat 4, 5, 7, 8, 9**
- ✅ **Sentinel-2** (via outra API)
- ✅ **MODIS**

### **Produtos:**
- 🌈 Imagens multiespectrais
- 🌡️ Temperatura de superfície
- 🌳 Índices de vegetação (NDVI, EVI)
- 💧 Índices de água
- 🏔️ Dados de elevação
- 📊 Análise de mudança temporal

### **Customizações:**
- 📐 Projeção (UTM, Albers, etc.)
- 🔄 Reamostramento
- 📦 Formato (GeoTIFF, HDF, etc.)
- ✂️ Recorte por área

---

## 💰 É Gratuito?

### ✅ **SIM! 100% GRATUITO!**

- ✅ Sem custo
- ✅ Sem limite de downloads
- ✅ Apenas precisa de conta USGS (gratuita)
- ✅ Dados públicos do governo dos EUA

---

## 🚀 Como Usar no GT Lands Dashboard:

### **Caso de Uso: Análise Temporal de Propriedades**

#### **Exemplo:**
1. **Buscar cenas Landsat** de uma propriedade
2. **Solicitar processamento** de imagens de 2015, 2020, 2024
3. **Baixar imagens** processadas
4. **Comparar mudanças** ao longo do tempo

#### **O que você pode detectar:**
- 🏗️ Construções novas
- 🌳 Mudanças na vegetação
- 💧 Alterações em corpos d'água
- 🏘️ Desenvolvimento urbano
- 🔥 Áreas queimadas

---

## 📋 Workflow Completo:

### **Passo 1: Autenticação**
```python
import requests

# Login com suas credenciais USGS
auth_url = "https://m2m.cr.usgs.gov/api/api/json/stable/login"
payload = {
    "username": "seu_usuario",
    "password": "sua_senha"
}
response = requests.post(auth_url, json=payload)
token = response.json()['data']
```

### **Passo 2: Buscar Cenas**
```python
# Buscar cenas Landsat para uma localização
search_url = "https://m2m.cr.usgs.gov/api/api/json/stable/scene-search"
headers = {"X-Auth-Token": token}

payload = {
    "datasetName": "landsat_ot_c2_l2",
    "spatialFilter": {
        "filterType": "mbr",
        "lowerLeft": {"latitude": 29.89, "longitude": -81.32},
        "upperRight": {"latitude": 29.90, "longitude": -81.31}
    },
    "temporalFilter": {
        "start": "2015-01-01",
        "end": "2024-12-31"
    }
}

response = requests.post(search_url, json=payload, headers=headers)
scenes = response.json()['data']['results']
```

### **Passo 3: Verificar Produtos Disponíveis**
```python
# Ver quais produtos ESPA pode gerar
products_url = "https://espa.cr.usgs.gov/api/v1/available-products"
scene_ids = [scene['entityId'] for scene in scenes]

response = requests.get(
    products_url,
    params={"inputs": ",".join(scene_ids)},
    auth=("usuario", "senha")  # Credenciais USGS
)
available = response.json()
```

### **Passo 4: Fazer Pedido**
```python
# Solicitar processamento
order_url = "https://espa.cr.usgs.gov/api/v1/order"

order_payload = {
    "landsat_ot_c2_l2": {
        "inputs": scene_ids[:3],  # Primeiras 3 cenas
        "products": ["sr", "ndvi", "evi"],  # Produtos desejados
        "format": "gtiff"
    },
    "projection": {
        "utm": {
            "zone": 17,
            "zone_ns": "north"
        }
    },
    "resampling_method": "nn",
    "note": "GT Lands Analysis"
}

response = requests.post(
    order_url,
    json=order_payload,
    auth=("usuario", "senha")
)
order_id = response.json()['orderid']
```

### **Passo 5: Verificar Status**
```python
# Verificar status do pedido
status_url = f"https://espa.cr.usgs.gov/api/v1/order/{order_id}"

response = requests.get(status_url, auth=("usuario", "senha"))
status = response.json()

# Quando completo, obter URLs de download
if status['status'] == 'complete':
    download_urls = [item['product_dload_url'] for item in status['orderid'][order_id]]
```

---

## ⚠️ Desafios:

### **1. Processamento Lento:**
- ⏱️ Pedidos podem levar **horas ou dias** para processar
- ⚠️ Não é em tempo real
- 💡 Precisa de sistema de fila/notificação

### **2. Complexidade:**
- ❌ Requer conhecimento de Python
- ❌ Workflow em múltiplas etapas
- ❌ Gerenciamento de downloads

### **3. Tamanho dos Arquivos:**
- 📦 Imagens Landsat são **grandes** (100-500MB cada)
- 💾 Precisa de armazenamento
- 🔄 Processamento local necessário

### **4. Cobertura de Nuvens:**
- ☁️ Imagens podem ter nuvens
- 🔍 Precisa filtrar cenas com baixa cobertura de nuvens
- 📅 Nem sempre há imagens claras disponíveis

---

## 💡 Para GT Lands Dashboard:

### **O que você pode implementar:**

#### **Seção: Análise Temporal (Landsat)**

**Funcionalidades:**
1. **Timeline Visual:**
   - Slider de anos (2015-2024)
   - Comparar propriedade em diferentes datas
   - Ver mudanças lado a lado

2. **Detecção Automática:**
   - 🏗️ Novas construções
   - 🌳 Mudança na vegetação (NDVI)
   - 💧 Alterações em água
   - 🔥 Áreas queimadas

3. **Relatório de Mudanças:**
   - % de área construída ao longo do tempo
   - Crescimento da vegetação
   - Desenvolvimento da região

---

## 🎯 Recomendação:

### **✅ VALE A PENA IMPLEMENTAR?**

#### **Prós:**
- ✅ **100% gratuito**
- ✅ Dados oficiais do governo
- ✅ 37+ anos de histórico
- ✅ Análise temporal poderosa
- ✅ Você já tem o token!

#### **Contras:**
- ❌ Processamento lento (horas/dias)
- ❌ Implementação complexa
- ❌ Requer backend Python
- ❌ Arquivos grandes
- ❌ Pode ter nuvens nas imagens

---

## 📝 Decisão Sugerida:

### **Opção 1: Implementar Agora** ⏱️ 1-2 semanas
- Backend Python para gerenciar pedidos
- Sistema de fila para processamento
- Interface para visualizar timeline
- **Benefício:** Análise temporal completa

### **Opção 2: Implementar Depois** 📋
- Focar em funcionalidades mais simples primeiro
- Implementar quando tiver mais tempo
- **Benefício:** Priorizar outras features

### **Opção 3: Versão Simplificada** ⏱️ 3-5 dias
- Apenas buscar e exibir cenas disponíveis
- Link para download manual
- Sem processamento automático
- **Benefício:** Funcionalidade básica rápida

---

## 🤔 Minha Recomendação:

### **Opção 3: Versão Simplificada**

**Por quê:**
1. ✅ Você já tem o token
2. ✅ Implementação mais rápida
3. ✅ Ainda agrega valor
4. ✅ Pode expandir depois

**O que fazer:**
- Mostrar cenas Landsat disponíveis para a propriedade
- Exibir datas e % de nuvens
- Link para download direto
- Thumbnail das imagens

**Depois pode evoluir para:**
- Processamento automático
- Comparação temporal
- Detecção de mudanças

---

## 🎯 Próximo Passo:

**Quer que eu:**
1. **Implemente versão simplificada agora?** (3-5 dias)
2. **Anote para implementar completo depois?** (1-2 semanas)
3. **Apenas mostre como usar o token manualmente?**

**Me diga!** 😊
