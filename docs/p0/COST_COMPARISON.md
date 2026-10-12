# 월 운영비 비교

**조사일 2026-10-09, USD/월, 세금·환율·인건비 제외.** AWS 기준 리전은 us-east-1, CloudFront는 미국 사용자 단가로 계산한 비교 기준이며 한국 실서비스 견적이 아니다. Cloudflare는 공개 글로벌 단가, D1 저장 위치/지연은 P4 측정 전이다. 무료 한도 미적용과 적용 가능 경우를 분리한다. 숫자는 견적 모델이며 실청구/운영 성능 보장이 아니다.

## 사용량 가정

|변수|MAU 1명당 월 가정|10,000MAU 시|
|---|---|---|
|세션|20회|200,000회|
|API|600회: 맵읽기40, 저장300, 목록/권한/기타260|6,000,000회|
|평균 맵 본문|20KB(십진), 현재 맵2개/MAU|현재 맵20,000개|
|정적 전송/요청|20MB,600 asset requests|200GB,600만 requests|
|API 응답 전송|1.5MB|15GB|
|전체 DB 물리 예산|0.5MB: 현재40KB+이력400KB(맵당10본)+metadata/index60KB|5GB|
|DynamoDB 읽기|3,500 RRU(4KB strong read 환산)|35M RRU|
|DynamoDB 쓰기|저장1회당88 WRU ×300|264M WRU|
|D1 rows read/write|3,000 / 2,500 (인덱스 영향 포함 추정)|30M /25M rows|
|Lambda|256MB·100ms/요청, x86|150,000GB-s|
|Workers CPU|평균5ms/요청|30M CPU-ms|
|로그|요청당500bytes,1event|3GB/6M events|
|이메일|확인·재설정·초대 합2통|20,000통|
|백업|일별 full7본 보관 + PITR/Time Travel|최대35GB full copies|

DynamoDB 저장1회는 current20KB+revision20KB+catalog/usage/audit/idempotency 각1KB를 **transactional**로 쓴다: `(20+20+4)×2=88 WRU`. 임의의 “쓰기1회=1WRU” 가정으로 낮추지 않았다. 읽기는 권한/세션·목록·본문 조회 예산이다. D1은 JSON size가 아닌 처리 rows 기반이나 인덱스·전체 scan·삭제 청소가 usage를 늘린다. 이를 P4 계측해야 한다.

로그 30일 보관은 AWS 예산, Cloudflare Workers 기본 로그는 현재 Paid7일이다. 서비스 감사기록90일은 DB 0.5MB 가정에 포함하므로 내용/증가량 확인이 필요하다. 비활성 사용자 데이터도 과금되며 본 표는 retained accounts≈MAU라는 초기 가정이다.

## 공식 단가와 계산 조건

|항목|단가/조건|공식 출처|
|---|---|---|
|Cognito Essentials|무료 미적용 첫 유료 구간 $0.015/MAU. direct/social 월10,000MAU 계정/조직 공용 한도 가능. Essentials 기본 설정 주의|[Cognito](https://aws.amazon.com/cognito/pricing/)|
|CloudFront pay-as-you-go|미국 유료구간 $0.085/GB, HTTPS $0.01/10k. 공개 free tier 1TB/10M requests가 남아 있으면 표 부하 내 전송0|[CloudFront](https://aws.amazon.com/cloudfront/pricing/pay-as-you-go/)|
|HTTP API|첫300M 요청 $1/M|[API Gateway](https://aws.amazon.com/api-gateway/pricing/)|
|Lambda|$0.20/M요청, x86 $0.0000166667/GB-s; 본 표 무료 크레딧 제외|[Lambda](https://aws.amazon.com/lambda/pricing/)|
|DynamoDB Standard|$0.625/M WRU, $0.125/M RRU, $0.25/GB-mo|[DynamoDB](https://aws.amazon.com/dynamodb/pricing/)|
|DynamoDB 백업|PITR $0.20/GB-mo, on-demand $0.10/GB-mo, 복원은 별도|[복구 비용](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamodbDisasterRecoveryStrategy.html)|
|CloudWatch|로그 입력 $0.50/GB, 보관 $0.03/GB 예산, 표준 알람3개×$0.10|[CloudWatch](https://aws.amazon.com/cloudwatch/pricing/)|
|Workers Paid|$5/월,10M요청·30M CPU-ms 포함, 초과 $0.30/M요청·$0.02/M CPU-ms; static assets 요청 무료|[Workers](https://developers.cloudflare.com/workers/platform/pricing/)|
|D1 Paid|25B rows read·50M rows write·5GB 포함, 초과 $0.001/M read·$1/M write·$0.75/GB-mo|[D1](https://developers.cloudflare.com/d1/platform/pricing/)|
|Workers Logs|20M events/월 포함, 초과 $0.60/M,7일 보관. 2026-12-01 요금 변경 예정|[Workers logs](https://developers.cloudflare.com/workers/platform/pricing/)|
|R2 Standard|$0.015/GB-mo,10GB·1M ClassA·10M ClassB free allowance; 유료A $4.50/M,B $0.36/M|[R2](https://developers.cloudflare.com/r2/pricing/)|
|SES|발송 $0.10/1,000통; 첨부·SMS·추가기능 제외|[SES](https://aws.amazon.com/ses/pricing/)|

S3 정적 원본 저장·요청에는 월$0.10 **예산 가정**을 두었다. 이번 추출에서 리전별 S3 동적 요금표 숫자를 직접 확인하지 못했으므로 정밀 견적으로 제시하지 않는다([공식 S3](https://aws.amazon.com/s3/pricing/)). 정적 origin 50MB·캐시 hit95%를 가정한 소액 항목이며 P4 AWS 선택 시 계산기 재산정 필요. API 응답 전송 $0.09/GB도 us-east 외부 전송용 **보수적 예산 입력값**으로 별도 표시한다. 도메인은 연$12→월$1의 구매 예산이며 특정 도메인 실가격이 아니다. 기본 Cloudflare DNS 사용, 별도 유료 support/WAF/NAT/고정IP 없음.

## A — AWS: 무료/크레딧 공제 전

|항목|10명|100 MAU|1,000 MAU|10,000 MAU|
|---|---:|---:|---:|---:|
|정적 전송(CDN)|0.023|0.230|2.300|23.000|
|인증(Essentials, 한도 미적용)|0.150|1.500|15.000|150.000|
|API Gateway|0.006|0.060|0.600|6.000|
|Lambda|0.004|0.037|0.370|3.700|
|API 응답 전송 예산|0.001|0.013|0.135|1.350|
|DB 읽기|0.004|0.044|0.438|4.375|
|DB 쓰기|0.165|1.650|16.500|165.000|
|DB 저장|0.001|0.013|0.125|1.250|
|로그·알람|0.302|0.316|0.459|1.890|
|백업(PITR+7본)|0.005|0.045|0.450|4.500|
|이메일|0.002|0.020|0.200|2.000|
|도메인·S3 요청저장 예산|1.100|1.100|1.100|1.100|
|**합계**|**1.76**|**5.03**|**37.68**|**364.17**|


## B — Cloudflare + Cognito Essentials

Workers Paid의 포함량은 $5 구독의 일부로 반영했다. 해당 서비스 전용 계정 예산으로 가정하며 다른 앱이 이미 포함량을 소비했다면 추가된다. Cognito MAU 무료 한도는 여기서 공제하지 않았다. R2 free allowance는 남아 있는 경우로 계산하고 아래 소진 위험을 별도 제시한다.

|항목|10명|100 MAU|1,000 MAU|10,000 MAU|
|---|---:|---:|---:|---:|
|정적 전송|0.000|0.000|0.000|0.000|
|인증(Essentials, 한도 미적용)|0.150|1.500|15.000|150.000|
|Workers 기본료|5.000|5.000|5.000|5.000|
|API 초과 요청·CPU|0.000|0.000|0.000|0.000|
|DB 읽기|0.000|0.000|0.000|0.000|
|DB 쓰기|0.000|0.000|0.000|0.000|
|DB 저장|0.000|0.000|0.000|0.000|
|로그|0.000|0.000|0.000|0.000|
|백업(R2+Time Travel)|0.000|0.000|0.000|0.375|
|이메일|0.002|0.020|0.200|2.000|
|도메인 예산|1.000|1.000|1.000|1.000|
|**합계**|**6.15**|**7.52**|**21.20**|**158.38**|


## 명시적 한도 적용 가능 시

A는 위 표에서 Cognito10k MAU와 CloudFront1TB/10M만 공제한다. Lambda·DynamoDB 저장·CloudWatch 등에 추가 무료가 있어도 여기서는 공제하지 않아 비교를 보수적으로 유지한다. B는 Cognito10k만 추가 공제한다. 가입 시점·조직 합산·다른 앱 사용량·요금 tier를 확인하기 전 실제 적용을 확정할 수 없다.

|조건부 월합계|10명|100MAU|1,000MAU|10,000MAU|
|---|---:|---:|---:|---:|
|A: 인증+CDN 한도 가능|$1.59|$3.30|$20.38|$191.17|
|B: 인증 한도 가능|$6.00|$6.02|$6.20|$8.38|

Cloudflare Workers Free는 100k요청/일·CPU10ms, D1 Free는 5M read/일·100k write/일, DB당500MB 등의 한도가 있다. 일일 burst/저장 실패 위험 때문에 상용 베타 기본안은 Paid다. MAU10명에서 AWS가 더 저렴할 수 있으며 Workers 최소요금을 숨기지 않는다.

## 민감도와 빠진 청구 위험

- 10kMAU에서 모든 맵이100KB가 되면 AWS transactional WRU는 약5배, D1 총보관량은 대략25GB 규모가 되어 **단일 DB10GB를 넘는다**. “D1 $5이면10k 사용자 무조건 충분”이라는 결론은 성립하지 않는다. 5GB 경고/7GB 이행 결정을 둔다.
- autosave가3배면 API18M, Workers CPU90M으로 요청초과$2.40+CPU$1.20, D1 write75M으로 초과$25가 추가된다(다른 부하·일정 비용 별도). AWS write도3배. 드래그 매 프레임 저장은 금지한다.
- 5초 polling을 항상 켜면 API600/MAU 가정을 크게 초과한다. 활성 탭에서 version 조건부 조회/백오프·포커스 시 새로고침으로 시작하고 계측한다.
- 비활성 포함 retained users가 MAU의10배면 저장/백업 역시 최대10배. 저장량은 MAU가 아닌 실제 bytes 기준으로 관리한다.
- Cognito Essentials→Plus 또는 Lite, SAML federation, SMS MFA, 추가 인증 기능 선택은 이 표와 다르다. SES production access·도메인 검증·수신 제한도 P4 조건이다.
- R2 무료량이 이미 소진되면7본 총35GB의 저장 약$0.525 외에 청구 단위 반올림된 ClassA/B 요청 비용(소량에도 약$4.50/$0.36 단위 가능)을 추가해야 한다. 백업 export의 Worker CPU와 D1 scan은 실측 전이며 월 $1~5 안전 예산을 별도로 둔다.
- 한국 CDN 유료 데이터 단가는 표의 미국 $0.085 대신 $0.120/GB 구간이므로200GB에서 전송만 $7 추가 가능; HTTPS 요청 및 AWS 서울 리전은 별도 재견적. D1 APAC location hint를 국내 리전 고정으로 해석하지 않는다.
- AWS 백업은 같은 계정/리전 기본이며 독립 계정·교차리전 복사·복원·S3 export는 별도. CF R2도 공급자 계정 자체 손실까지 방어하는 독립 외부 백업은 아니다.
- 공격 트래픽, 공개 링크 이용자, 로그 이벤트 증폭, 빌드/CI 유료 사용, 결제 수수료, 법무/지원 인건비, 부가세는 포함하지 않았다. paid WAF 도입은 비용 변경 승인 대상이다.

결론: 정상 사용 가정에서는 B가 성장 구간에서 유리하나, SQL/배포 단순성과 함께 선택한 권장안이다. 베타 월 예산은 B 조건부 기본비에 $1~5 백업/운영 여유를 더하고 초기 경보 $10/$20/$50로 제안한다. 실제 알람 생성은 P9 승인 후다. 계산 재현: `python evidence/cost_model.py`; 행별 원시값은 cost_model.json.
