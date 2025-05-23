# meeyoung-vending-machine

## 실행 방법
1. index.html 파일을 브라우저에서 열어주세요.
2. 결제 수단을 선택하고 음료를 선택하면 결과가 표시됩니다.

## 버전
- TypeScript v5.x
  
## 사용 기술
- Javascript (ES6)
- Typescript
- HTML / CSS

## 다이어그램
<img width="1492" alt="diagram" src="https://github.com/user-attachments/assets/81e9feaa-64de-4c05-a5a3-3b6c9203e490" />


## 주요 기능
- 현금 또는 카드로 결제 가능
- 음료 선택 및 재고 감소
- 자판기 내부 재고 및 화폐 잔량 표시
- 현금일 경우 잔돈 반환 로직
- 카드 결제는 1회만 가능

## 예외 케이스
- 사용 불가능한 지폐 또는 카드
- 재고 부족 시 구매 제한
- 잔액 부족 또는 잔돈 반환 불가 시 안내
- 카드 결제 후 추가 구매 시도 제한
