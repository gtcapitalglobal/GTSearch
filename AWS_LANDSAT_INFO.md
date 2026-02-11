# AWS Landsat S3 - Informações Técnicas

## Bucket S3
- **Bucket:** `usgs-landsat`
- **Path:** `collection02/`
- **Region:** `us-west-2`
- **Acesso:** Requester Pays (mas pode acessar via HTTP público)

## AWS CLI Access
```bash
aws s3 ls --request-payer requester s3://usgs-landsat/collection02/
```

## STAC Catalog
- URL: https://landsatlook.usgs.gov/stac-browser
- Permite buscar cenas por coordenadas e data

## Estrutura de Dados
- Collection 2 (mais recente)
- Landsat 1, 2, 3, 4, 5, 7, 8, 9
- Dados desde 1972 até presente
- Novas cenas adicionadas diariamente

## Licença
- **100% Gratuito**
- Sem restrições de uso
- Pode ser redistribuído
- Apenas solicita citação da fonte

## Formato
- Cloud-Optimized GeoTIFF (COG)
- Acesso direto via HTTP
- Não precisa baixar arquivo completo

## Próximos Passos
1. Usar STAC API para buscar cenas por coordenadas + data
2. Obter URLs das imagens
3. Retornar para frontend
