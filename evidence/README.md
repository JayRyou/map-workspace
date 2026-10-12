# P2 실행 증거

최종: unit-final.log, build-final.log, e2e-results.json/e2e-run.log, accessibility.json/accessibility-run.log, delivery.json/delivery-run.log, performance.json/performance-run.log.

performance-before-cache.json / performance-after-cache.json은 수정 전 수치이며 최종 PASS를 뜻하지 않습니다. archive는 수정 전 실패 기록입니다. p2-1~4는 단계별 검사입니다. stages.json은 착수/완료 원장입니다. p1/은 원본 과거 단계 증거이며 P2 검사 수에 포함하지 않습니다.

npm-ci.log는 캐시 누락 설치 실패, npm-ci-dry-run.log는 계획 해석 성공이며 실제 새 설치는 UNVERIFIED입니다. source-integrity-p2.json은 원본754개 및 복사 문서 무변경 확인입니다. FILE_MANIFEST.json은 최종 파일 해시입니다. CPU 프로파일 원본은 ZIP에 포함하지 않으며 tests/performance.mjs로 새 측정할 수 있습니다.
