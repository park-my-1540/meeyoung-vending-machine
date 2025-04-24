// ─────────────────────────────
//  타입 및 상태 변수 정의
// ─────────────────────────────

type Drink = "cola" | "water" | "coffee"; // 자판기에서 판매하는 음료 타입
type PaymentMethod = "cash" | "card"; // 결제 수단 타입

interface Item {
  price: number; // 가격
  stock: number; // 재고
}

// 음료 재고 현황
let inventory: Record<Drink, Item> = {
  cola: { price: 1100, stock: 2 },
  water: { price: 600, stock: 2 },
  coffee: { price: 700, stock: 2 },
};

// 자판기 내부 화폐 재고 (단위별 개수)
let cashStock = {
  10000: 10,
  5000: 10,
  1000: 10,
  500: 10,
  100: 10,
};

type CashAmount = keyof typeof cashStock; // 화폐 단위 타입

// 결제 승인 시 딜레이 시뮬레이션
const CASH_DELAY_MS = 500;
const CARD_DELAY_MS = 1000;
const APPROVE_RATE = 0.8; // 결제 승인 확률

// 사용자의 선택/상태 관리
let userOrders = new Map<Drink, number>(); // 사용자가 주문한 음료수
let balance: number = 0; // 투입된 총 금액
let paymentMethod: PaymentMethod | null = null; // 현재 결제 수단

// 결제 유효성 상태
let cashApproved: boolean = false; // 현금 사용 가능 여부
let cardApproved: boolean = false; // 카드 승인 여부

// 시스템 흐름 제어
let isRefundingChange = false; // 잔돈 반환 중 여부
let cardUsedOnce = false; // 카드 결제 1회 제한 여부

// 로그 출력 위치 식별자
enum LogType {
  DEFAULT = "log",
  CARD = "card-log",
  CASH = "cash-log",
}

// ─────────────────────────────
//  로그 함수
// ─────────────────────────────

/**
 * 지정한 로그 타입 영역에 메시지를 출력한다.
 * @param type - 로그 영역 타입 (DEFAULT, CARD, CASH)
 * @param msg - 출력할 메시지
 */
const logMessage = (type: LogType, msg: string): void => {
  const el = document.getElementById(type);
  if (el) el.innerHTML = `<p>${msg}</p>`;
};

// 각 로그타입에 대한 단축 함수
const log = (msg: string): void => logMessage(LogType.DEFAULT, msg);
const cardLog = (msg: string): void => logMessage(LogType.CARD, msg);
const cashLog = (msg: string): void => logMessage(LogType.CASH, msg);

/**
 * 카드 및 현금 로그 영역 초기화
 */
const initPaymentLog = (): void => {
  cardLog("");
  cashLog("");
};

/**
 * 음료 상태에 따른 메시지 출력 (에러가 없으면 기본 안내 문구)
 */
function logDrinkStateMsg(error: string | null): void {
  if (error) {
    log(error);
  } else {
    log("음료를 선택해주세요.");
  }
}

// ─────────────────────────────
//  렌더링 함수
// ─────────────────────────────

/**
 * 현재 잔액을 화면에 표시
 */
function renderBalance(): void {
  const el = document.getElementById("balance-log");
  if (el) el.textContent = `잔액: ${balance.toLocaleString("ko-KR")}원`;
}

/**
 * 사용자 주문 내역을 화면에 표시
 */
function renderUserOrders(): void {
  const el = document.getElementById("selected-drink-log");
  let msg = "";
  for (const [key, value] of Array.from(userOrders)) {
    msg += `<p>${key} : ${value}개</p>`;
  }
  if (el) el.innerHTML = msg;
}

/**
 * 자판기 재고 현황을 화면에 표시
 */
function renderInventory(): void {
  const el = document.getElementById("inventory-log");
  let msg = "";
  for (const [key, value] of Object.entries(inventory)) {
    msg += `<p>${key} ${value.stock}개</p>`;
  }
  if (el) el.innerHTML = msg;
}

/**
 * 자판기 현금 재고 현황을 화면에 표시
 */
function renderCashStock(): void {
  const el = document.getElementById("cashStock-log");
  let msg = "";
  for (const [key, value] of Object.entries(cashStock)) {
    msg += `<p>${key}원 ${value}개</p>`;
  }
  if (el) el.innerHTML = msg;
}

// ─────────────────────────────
//  버튼 / UI 조작 함수
// ─────────────────────────────

/**
 * 현재 상태에 따라 음료 버튼의 활성화 여부를 갱신
 */
function updateDrinkBtnState(): void {
  const drinks: Drink[] = ["cola", "water", "coffee"];

  drinks.forEach((drink) => {
    const validStateMsg = isRefundingChange ? null : getValidateStateMsg(drink);
    toggleDrinkBtn(drink, validStateMsg);

    if (!isRefundingChange) {
      logDrinkStateMsg(validStateMsg);
    }
  });
}

/**
 * 음료 선택 활성화/비활성화 상태 변경
 * @param drink - 음료 종류
 * @param validStateMsg - 유효성 검사 결과 메시지 null이면 성공
 */
function toggleDrinkBtn(drink: Drink, validStateMsg: string | null): void {
  const btn = document.querySelector(`#${drink}`);
  if (!btn) return;

  if (validStateMsg !== null) {
    btn.classList.add("inactive");
    btn.setAttribute("title", validStateMsg);
  } else {
    btn.classList.remove("inactive");
    btn.removeAttribute("title");
  }
}

/**
 * 결제 수단 버튼 비활성화
 * @param method - 결제 수단 (cash, card)
 */
function disableOtherPaymentMethod(method: PaymentMethod): void {
  if (method === "cash") {
    document
      .querySelectorAll("._cardContainer button")
      .forEach((btn) => btn.setAttribute("disabled", "true"));
    document.querySelector("#return-change")?.removeAttribute("disabled");
  } else {
    document
      .querySelectorAll("._cashContainer button")
      .forEach((btn) => btn.setAttribute("disabled", "true"));
    document.querySelector("#return-change")?.setAttribute("disabled", "true");
  }
}

/**
 * 결제 수단 버튼 활성화
 */
function enablePaymentBtns(): void {
  document
    .querySelectorAll("._paymentContainer button")
    .forEach((btn) => btn.removeAttribute("disabled"));
  document.querySelector("#return-change")?.removeAttribute("disabled");
}

// ─────────────────────────────
//  상태 변경 함수
// ─────────────────────────────
/**
 * 잔액 증가
 * @param amount - 증가할 금액
 */
function addToBalance(amount: number): void {
  changeBalance(amount);
}

/**
 * 잔액 감소
 * @param amount - 감소할 금액
 */
function subtractFromBalance(amount: number): void {
  changeBalance(-amount);
}

/**
 * 잔액 변경
 * @param amount - 변경할 금액
 */
function changeBalance(amount: number): void {
  balance += amount;
  renderBalance();
  updateDrinkBtnState();
}

/**
 * 잔액 초기화
 */
function initBalance(): void {
  balance = 0;
  renderBalance();
  updateDrinkBtnState();
}

/**
 * 음료 재고 감소
 * @param drink - 음료 종류
 */
function decreaseInventory(drink: Drink): void {
  inventory[drink].stock--;
  renderInventory();
  updateDrinkBtnState();
}

/**
 * 사용자 주문 내역 증가
 * @param drink - 음료 종류
 */
function addToUserOrder(drink: Drink): void {
  userOrders.set(drink, (userOrders.get(drink) || 0) + 1);
  renderUserOrders();
}

/**
 * 현금 재고 증가
 * @param amount - 증가할 금액
 */
function increaseCashStock(amount: CashAmount): void {
  cashStock[amount]++;
  renderCashStock();
}

/**
 * 현금 재고 감소
 * @param change - 감소할 현금 재고
 */
function decreaseCashStock(change: Record<CashAmount, number>): void {
  for (const coin in change) {
    cashStock[coin] -= change[coin];
  }
  renderCashStock();
}

// ─────────────────────────────
//  주요 로직 함수
// ─────────────────────────────

/**
 * 잔액 반환
 */
function refundChange(): void {
  isRefundingChange = true;

  const change = getChangeCombination(balance);
  if (change) {
    decreaseCashStock(change);
  }

  log(`거스름돈 ${balance}원 반환 완료!`);
  initBalance();
  initPaymentMethod();

  isRefundingChange = false;
}

/**
 * 현금 결제
 * @param amount - 결제할 금액
 */
async function useCash(amount: CashAmount): Promise<void> {
  setPaymentMethod("cash");
  cashLog("지폐 확인 중...");

  const approved: boolean = await validateCash(amount);
  if (approved) {
    successCash(amount);
  } else {
    cashLog("사용불가능한 지폐입니다. 지폐를 다시 넣어주세요.");
    cashApproved = false;
  }
}

/**
 * 현금 결제 성공
 * @param amount - 결제할 금액
 */
function successCash(amount: CashAmount): void {
  cashApproved = true;
  processCashReceipt(amount);
  cashLog("사용 가능한 지폐 확인 완료!");
}

/**
 * 현금 결제 처리
 * @param amount - 결제할 금액
 */
function processCashReceipt(amount: CashAmount): void {
  addToBalance(amount);
  increaseCashStock(amount);
}

/**
 * 결제 수단 설정
 * @param method - 결제 수단 (cash, card)
 */
function setPaymentMethod(method: PaymentMethod): void {
  paymentMethod = method;
  disableOtherPaymentMethod(method);
}

/**
 * 카드 결제
 * @param amount - 결제할 금액
 */
async function useCard(): Promise<void> {
  setPaymentMethod("card");
  cardLog("결제 승인 중...");
  const approved: boolean = await validateCard();
  cardApproved = approved;

  updateDrinkBtnState();

  if (approved) {
    cardLog("결제 승인 성공!");
  } else {
    cardLog("결제 승인 실패");
    init();
  }
}

/**
 * 유저의 선택에 따라 음료 구매 처리
 * @param drink - 음료 종류
 */
function selectDrink(drink: Drink): void {
  const validateStateMsg = getValidateStateMsg(drink); //null 이면 유효성 통과
  if (validateStateMsg) {
    updateDrinkBtnState();
    return log(validateStateMsg);
  }
  processPayment(drink);
}

/**
 * 결제 처리
 * @param drink - 음료 종류
 */
function processPayment(drink: Drink): void {
  if (paymentMethod === "cash") {
    subtractFromBalance(inventory[drink].price);
    buyDrink(drink);
  }
  if (paymentMethod === "card") {
    buyDrink(drink);
    log(`카드 ${inventory[drink].price}원 승인 완료!`);
    cardOrderEnd();
  }
}

/**
 * 음료 구매
 * @param drink - 음료 종류
 */
function buyDrink(drink: Drink): void {
  decreaseInventory(drink);
  addToUserOrder(drink);
  log(`${drink} 구매 완료!`);
  initPaymentLog();
}

/**
 * 카드 결제 종료
 */
function cardOrderEnd(): void {
  cardUsedOnce = true;
  initPaymentLog();
  initPaymentMethod();
  updateDrinkBtnState();
  cardUsedOnce = false;
}

// ─────────────────────────────
//  유효성 검사 함수
// ─────────────────────────────

/**
 * 결제 유효성 검사
 * @returns - 유효성 검사 결과 메시지 null이면 성공
 */
function validatePayment(): string | null {
  if (!cashApproved && paymentMethod === "cash") {
    return "사용불가능한 지폐입니다. 지폐를 다시 넣어주세요.";
  }
  if (!cardApproved && paymentMethod === "card") {
    return "사용불가능한 카드입니다. 결제수단을 다시 선택해주세요.";
  }
  if (cardUsedOnce) {
    return "주문이 완료되었습니다. 다시 주문하려면 결제 수단을 선택해주세요.";
  }
  if (paymentMethod === null) {
    return "결제수단을 선택해주세요.";
  }
  return null;
}

/**
 * 음료 구매 유효성 검사
 * @param drink - 음료 종류
 * @returns - 유효성 검사 결과 메시지 null이면 성공
 */
function validatePurchase(drink: Drink): string | null {
  if (paymentMethod === "cash" && !isEnoughBalance(drink)) {
    return "잔액이 부족합니다.";
  }
  if (!isEnoughStock(drink)) {
    return "재고가 부족합니다.";
  }
  if (paymentMethod === "cash" && !isChangeAvailable(drink)) {
    return "잔돈이 부족하여 해당음료를 구매할 수 없습니다. 다른 음료를 선택해주세요.";
  }
  return null;
}

/**
 * 음료 구매 유효성 검사
 * @param drink - 음료 종류
 * @returns {boolean} - 유효성 검사 결과 메시지 null이면 성공
 */
function getValidateStateMsg(drink: Drink): string | null {
  return validatePurchase(drink) || validatePayment();
}

/**
 * 현금 결제 유효성 검사
 * @param amount - 결제할 금액
 * @returns {boolean} - 유효성 검사 결과 메시지
 */
function validateCash(amount: number): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(Math.random() < APPROVE_RATE); //80% 확률로 승인
    }, CASH_DELAY_MS);
  });
}

/**
 * 카드 결제 유효성 검사
 * @returns {boolean} - 유효성 검사 결과 메시지
 */
function validateCard(): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(Math.random() < APPROVE_RATE); //80% 확률로 승인
    }, CARD_DELAY_MS);
  });
}

/**
 * 잔액이 충분한가
 * @param drink - 음료 종류
 * @returns {boolean} - 잔액이 충분한가
 */
function isEnoughBalance(drink: Drink): boolean {
  return balance >= inventory[drink].price;
}

/**
 * 재고가 충분한가
 * @param drink - 음료 종류
 * @returns {boolean} - 재고가 충분한가
 */
function isEnoughStock(drink: Drink): boolean {
  return inventory[drink].stock > 0;
}

/**
 * 거슬러줄 잔돈이 있는가
 * @param drink - 음료 종류
 * @returns {boolean} - 거슬러줄 잔돈이 있는가
 */
function isChangeAvailable(drink: Drink): boolean {
  const changeAmount = balance - inventory[drink].price;
  const change = getChangeCombination(changeAmount);
  return change !== null;
}

/**
 * 잔돈 찾기
 * @param amount - 잔돈 찾기
 * @returns {Record<CashAmount, number> | null} - 잔돈 찾기
 */
function getChangeCombination(
  amount: number
): Record<CashAmount, number> | null {
  const coins = Object.keys(cashStock)
    .map(Number)
    .sort((a, b) => b - a);

  function dfs(
    remaining: number,
    index: number,
    tempInventory: Partial<Record<CashAmount, number>>,
    currentChange: Partial<Record<CashAmount, number>>
  ): Record<CashAmount, number> | null {
    if (remaining === 0) return currentChange as Record<CashAmount, number>;
    if (index >= coins.length) return null; // 동전 다 돌았는데도 남은 금액이 있다면 불가능

    const coin = coins[index];
    const maxCount = Math.min(
      Math.floor(remaining / coin),
      tempInventory[coin]
    );

    for (let i = maxCount; i >= 0; i--) {
      const nextRemaining = remaining - coin * i;
      const nextInventory = {
        ...tempInventory,
        [coin]: tempInventory[coin] - i,
      };
      const nextChange = { ...currentChange };
      if (i > 0) nextChange[coin] = i;

      const result = dfs(nextRemaining, index + 1, nextInventory, nextChange);
      if (result) return result;
    }
    return null;
  }
  return dfs(amount, 0, { ...cashStock }, {});
}

// ─────────────────────────────
//  초기화 + 유틸함수
// ─────────────────────────────

/**
 * 초기화
 */
function init(): void {
  initBalance();
  initPaymentMethod();
  initUserOrders();
  initInventory();
}

/**
 * 결제 수단 초기화
 */
function initPaymentMethod(): void {
  paymentMethod = null;
  enablePaymentBtns();
}

/**
 * 사용자 주문 내역 초기화
 */
function initUserOrders(): void {
  userOrders.clear();
  renderUserOrders();
}

/**
 * 음료 재고 초기화
 */
function initInventory(): void {
  renderInventory();
  renderCashStock();
}

/**
 * 모든 버튼 디바운스 적용 - 중복 클릭방지
 */
function initEventListeners(): void {
  document.querySelectorAll("button").forEach((btn) => {
    const handler = btn.onclick;
    if (handler) {
      btn.onclick = debounce(handler, 300);
    }
  });
}

/**
 * 디바운스
 * @param func - 함수
 * @param delay - 딜레이
 * @returns {Function} - 디바운스 함수
 */
function debounce(
  func: (...args: any[]) => void,
  delay: number
): (...args: any[]) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

init();
initEventListeners();
