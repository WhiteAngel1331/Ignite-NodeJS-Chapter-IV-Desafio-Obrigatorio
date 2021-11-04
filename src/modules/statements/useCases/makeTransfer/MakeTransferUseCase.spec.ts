import { AppError } from "../../../../shared/errors/AppError";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { IUsersRepository } from "../../../users/repositories/IUsersRepository";
import { AuthenticateUserUseCase } from "../../../users/useCases/authenticateUser/AuthenticateUserUseCase";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { IStatementsRepository } from "../../repositories/IStatementsRepository";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { GetBalanceUseCase } from "../getBalance/GetBalanceUseCase";
import { MakeTransferUseCase } from "./MakeTransferUseCase";

let createUserUseCase: CreateUserUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;
let usersRepository: IUsersRepository;
let statementRepository: IStatementsRepository;
let createStatementUseCase: CreateStatementUseCase;
let getBalanceUseCase: GetBalanceUseCase;
let makeTransferUseCase: MakeTransferUseCase;

enum OperationType {
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw",
}

describe("Make transfer", () => {
  beforeEach(async () => {
    usersRepository = new InMemoryUsersRepository();
    statementRepository = new InMemoryStatementsRepository();

    createUserUseCase = new CreateUserUseCase(usersRepository);
    authenticateUserUseCase = new AuthenticateUserUseCase(usersRepository);

    createStatementUseCase = new CreateStatementUseCase(
      usersRepository,
      statementRepository
    );

    getBalanceUseCase = new GetBalanceUseCase(
      statementRepository,
      usersRepository
    );

    makeTransferUseCase = new MakeTransferUseCase(statementRepository);

    await createUserUseCase.execute({
      email: "white@angel.com.br",
      name: "white",
      password: "123456",
    });

    await createUserUseCase.execute({
      email: "anna@luisa.com.br",
      name: "anna",
      password: "123456",
    });
  });

  it("cannot get statement operation if user is not authenticated", async () => {
    expect(async () => {
      const session = await authenticateUserUseCase.execute({
        email: "white@angel.com.br",
        password: "1234569",
      });
    }).rejects.toBeInstanceOf(AppError);
  });

  it("Should be able make a transfer", async () => {
    const whiteSession = await authenticateUserUseCase.execute({
      email: "white@angel.com.br",
      password: "123456",
    });

    const annaSession = await authenticateUserUseCase.execute({
      email: "anna@luisa.com.br",
      password: "123456",
    });

    await createStatementUseCase.execute({
      amount: 1000,
      description: "test",
      type: "deposit" as OperationType,
      user_id: whiteSession.user.id as string,
    });

    const whiteBalance = await getBalanceUseCase.execute({
      user_id: whiteSession.user.id as string,
    });

    const annaBalance = await getBalanceUseCase.execute({
      user_id: annaSession.user.id as string,
    });

    await makeTransferUseCase.execute({
      amount: 500,
      description: "test",
      from_user_id: whiteSession.user.id as string,
      to_user_id: annaSession.user.id as string,
    });

    const whiteBalanceAfterTransfer = await getBalanceUseCase.execute({
      user_id: whiteSession.user.id as string,
    });

    const annaBalanceAfterTransfer = await getBalanceUseCase.execute({
      user_id: annaSession.user.id as string,
    });

    expect(whiteBalanceAfterTransfer.balance).toBe(500);
    expect(annaBalanceAfterTransfer.balance).toBe(annaBalance.balance + 500);
  });

  it("Should not be able make a transfer if user does not have enough balance", async () => {
    const whiteSession = await authenticateUserUseCase.execute({
      email: "white@angel.com.br",
      password: "123456",
    });

    const annaSession = await authenticateUserUseCase.execute({
      email: "anna@luisa.com.br",
      password: "123456",
    });

    await createStatementUseCase.execute({
      amount: 1000,
      description: "test",
      type: "deposit" as OperationType,
      user_id: whiteSession.user.id as string,
    });

    const whiteBalance = await getBalanceUseCase.execute({
      user_id: whiteSession.user.id as string,
    });

    const annaBalance = await getBalanceUseCase.execute({
      user_id: annaSession.user.id as string,
    });

    expect(async () => {
      await makeTransferUseCase.execute({
        amount: 1500,
        description: "test",
        from_user_id: whiteSession.user.id as string,
        to_user_id: annaSession.user.id as string,
      });

      const whiteBalanceAfterTransfer = await getBalanceUseCase.execute({
        user_id: whiteSession.user.id as string,
      });

      const annaBalanceAfterTransfer = await getBalanceUseCase.execute({
        user_id: annaSession.user.id as string,
      });
    }).rejects.toBeInstanceOf(AppError);
  });
});
