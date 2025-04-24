type Drink = "cola" | "water" | "coffee";
type PaymentMethod = "cash" | "card";

interface Item {
  price: number;
  stock: number;
}

let inventory: Record<Drink, Item> = {
  cola: { price: 1100, stock: 2 },
  water: { price: 600, stock: 2 },
  coffee: { price: 700, stock: 2 },
};

// 자판기내에 가지고 있는 화폐의 갯수
let cashInventory = {
  10000: 10,
  5000: 10,
  1000: 10,
  500: 10,
  100: 10,
};

const CASH_DELAY_MS = 500;
const CARD_DELAY_MS = 1000;
const APPROVE_RATE = 0.8; // 승인 확률

let userOrders = new Map<Drink, number>(); // 사용자가 주문한 음료수
let balance: number = 0; // 잔액
let paymentMethod: PaymentMethod | null = null; // 결제 수단

let cashApproved: boolean = false; // 현금 승인 여부
let cardApproved: boolean = false; // 카드 승인 여부

let isRefundingChange = false; // 반환 여부

enum LogType {
  DEFAULT = "log",
  CARD = "card-log",
  CASH = "cash-log",
}

// 메세지 로그, 렌더링 함수
const logMessage = (type: LogType, msg: string): void => {
  const el = document.getElementById(type);
  if (el) el.innerHTML = `<p>${msg}</p>`;
};

const log = (msg: string): void => logMessage(LogType.DEFAULT, msg);
const cardLog = (msg: string): void => logMessage(LogType.CARD, msg);
const cashLog = (msg: string): void => logMessage(LogType.CASH, msg);

const initPaymentLog = (): void => {
  cardLog("");
  cashLog("");
};

// 음료 선택에 따른 메세지 로그
function logDrinkStateMsg(error: string | null): void {
  if (error) {
    log(error);
  } else {
    log("음료를 선택해주세요.");
  }
}

function renderBalance(): void {
  const el = document.getElementById("balance");
  if (el) el.textContent = `잔액: ${balance.toLocaleString("ko-KR")}원`;
}

function renderUserOrders(): void {
  const el = document.getElementById("selected-drink-log");
  let msg = "";
  for (const [key, value] of Array.from(userOrders)) {
    msg += `<p>${key} : ${value}개</p>`;
  }
  if (el) el.innerHTML = msg;
}

function renderInventory(): void {
  const el = document.getElementById("inventory-log");
  let msg = "";
  for (const [key, value] of Object.entries(inventory)) {
    msg += `<p>${key} ${value.stock}개</p>`;
  }
  if (el) el.innerHTML = msg;
}

function renderCashInventory(): void {
  const el = document.getElementById("cash-inventory-log");
  let msg = "";
  for (const [key, value] of Object.entries(cashInventory)) {
    msg += `<p>${key}원 ${value}개</p>`;
  }
  if (el) el.innerHTML = msg;
}

// 버튼 / UI 조작 함수
function refreshDrinkButtons(isRefundingChange?: boolean): void {
  const drinks: Drink[] = ["cola", "water", "coffee"];

  drinks.forEach((drink) => {
    if (isRefundingChange) {
      // 잔액 반환 중이면 유효성 검사 패스
      updateDrinkButtonUI(drink, null);
    } else {
      const drinkStatus = getValidateStatus(drink); //유효성 검사

      logDrinkStateMsg(drinkStatus); // 유효성 검사 결과 메세지 출력
      updateDrinkButtonUI(drink, drinkStatus); // 유효성 검사 결과 버튼 UI 업데이트
    }
  });
}

// 음료 선택 버튼 UI 업데이트
function updateDrinkButtonUI(drink: Drink, error: string | null): void {
  const btn = document.querySelector(`#${drink}`);
  if (!btn) return;

  if (error) {
    btn.classList.add("inactive");
    btn.setAttribute("title", error);
  } else {
    btn.classList.remove("inactive");
    btn.removeAttribute("title");
  }
}

// 결제 수단 버튼 비활성화
function disablePaymentBtns(method: PaymentMethod): void {
  paymentMethod = method;
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

// 결제 수단 버튼 활성화
function enablePaymentBtns(): void {
  document
    .querySelectorAll("._paymentContainer button")
    .forEach((btn) => btn.removeAttribute("disabled"));
  document.querySelector("#return-change")?.removeAttribute("disabled");
}

// 상태 변경 함수
// 잔액이 변경 되면 재렌더링, 음료 버튼 재세팅
function changeBalance(amount: number): void {
  balance += amount;
  renderBalance();
  refreshDrinkButtons();
}

function addToBalance(amount: number): void {
  changeBalance(amount);
}

function subtractFromBalance(amount: number): void {
  changeBalance(-amount);
}

function zeroBalance(): void {
  balance = 0;
  renderBalance();
  refreshDrinkButtons(isRefundingChange);
}

function decreaseInventory(drink: Drink): void {
  inventory[drink].stock--;
  renderInventory();
  refreshDrinkButtons();
}

function addToOrder(drink: Drink): void {
  userOrders.set(drink, (userOrders.get(drink) || 0) + 1);
  renderUserOrders();
}

// 주요 로직 함수

// 잔액 반환
function returnChange(): void {
  isRefundingChange = true;

  const change = findChange(balance);
  for (const coin in change) {
    cashInventory[coin] -= change[coin];
  }
  renderCashInventory();

  log(`거스름돈 ${balance}원 반환 완료!`);
  zeroBalance();
  enablePaymentBtns();

  isRefundingChange = false;
}

// 현금 결제
async function useCash(amount: number): Promise<void> {
  disablePaymentBtns("cash");
  cashLog("지폐 확인 중...");

  const approved: boolean = await validateCash(amount);
  if (approved) {
    successCash(amount);
  } else {
    cashLog("사용불가능한 지폐입니다. 지폐를 다시 넣어주세요.");
    cashApproved = false;
    refreshDrinkButtons();
    init();
  }
}

// 현금 결제 성공 하면 잔액 증가, 음료 버튼 활성화, 로그 출력
function successCash(amount: number): void {
  cashApproved = true;
  addToBalance(amount);
  cashLog("사용 가능한 지폐 확인 완료!");
}

async function useCard(): Promise<void> {
  disablePaymentBtns("card");
  cardLog("결제 승인 중...");

  const approved: boolean = await validateCard();
  cardApproved = approved;

  refreshDrinkButtons();

  if (approved) {
    cardLog("결제 승인 성공!");
  } else {
    cardLog("결제 승인 실패");
    init();
  }
}

// 유저의 선택에 따라 음료 구매 처리
function selectDrink(drink: Drink): void {
  const error = getValidateStatus(drink);
  if (error) {
    refreshDrinkButtons();
    return log(error);
  }

  if (paymentMethod === "cash") {
    subtractFromBalance(inventory[drink].price);
  }
  if (paymentMethod === "card") {
    log(`카드 ${inventory[drink].price}원 승인 완료!`);
  }

  buyDrink(drink);
}

function buyDrink(drink: Drink): void {
  decreaseInventory(drink);
  addToOrder(drink);
  log(`${drink} 구매 완료!`);
  initPaymentLog();
}

function orderEnd(): void {
  initPaymentLog();
  init();
  logDrinkStateMsg(null);
}

function checkValidate(): string | null {
  if (!cashApproved && paymentMethod === "cash") {
    return "사용불가능한 지폐입니다. 지폐를 다시 넣어주세요.";
  }
  if (!cardApproved && paymentMethod === "card") {
    return "사용불가능한 카드입니다. 결제수단을 다시 선택해주세요.";
  }
  if (paymentMethod === null) {
    return "결제수단을 선택해주세요.";
  }
  return null;
}

// 유효성 검사 함수
function canBuy(drink: Drink): string | null {
  if (paymentMethod === "cash" && !isEnoughBalance(drink)) {
    return "잔액이 부족합니다.";
  }

  if (!isEnoughStock(drink)) {
    return "재고가 부족합니다.";
  }

  if (paymentMethod === "cash" && !canGiveChange(drink)) {
    return "잔돈이 부족하여 해당음료를 구매할 수 없습니다. 다른 음료를 선택해주세요.";
  }
  return null;
}

function getValidateStatus(drink: Drink): string | null {
  return canBuy(drink) || checkValidate();
}

function validateCash(amount: number): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(Math.random() < APPROVE_RATE); //80% 확률로 승인
    }, CASH_DELAY_MS);
  });
}

function validateCard(): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(Math.random() < APPROVE_RATE); //80% 확률로 승인
    }, CARD_DELAY_MS);
  });
}

// 잔액이 충분한가
function isEnoughBalance(drink: Drink): boolean {
  return balance >= inventory[drink].price;
}

// 재고가 충분한가
function isEnoughStock(drink: Drink): boolean {
  return inventory[drink].stock > 0;
}

// 거슬러줄 잔돈이 있는가
function canGiveChange(drink: Drink): boolean {
  const changeAmount = balance - inventory[drink].price;
  const change = findChange(changeAmount);
  return change !== null;
}

// 잔돈 찾기
function findChange(amount: number): Record<number, number> | null {
  const coins = Object.keys(cashInventory)
    .map(Number)
    .sort((a, b) => b - a);

  function dfs(
    remaining: number,
    index: number,
    tempInventory: Record<number, number>,
    currentChange: Record<number, number>
  ): Record<number, number> | null {
    if (remaining === 0) return currentChange;
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
  return dfs(amount, 0, { ...cashInventory }, {});
}

// 초기화 + 유틸
function init(): void {
  zeroBalance();
  initPaymentMethod();
  initUserOrders();
  initInventory();
}

function initPaymentMethod(): void {
  paymentMethod = null;
  enablePaymentBtns();
}

function initUserOrders(): void {
  userOrders.clear();
  renderUserOrders();
}

function initInventory(): void {
  renderInventory();
  renderCashInventory();
}

// 모든 버튼 디바운스 적용 - 중복 클릭방지
function initEventListeners(): void {
  document.querySelectorAll("button").forEach((btn) => {
    const handler = btn.onclick;
    if (handler) {
      btn.onclick = debounce(handler, 300);
    }
  });
}

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
