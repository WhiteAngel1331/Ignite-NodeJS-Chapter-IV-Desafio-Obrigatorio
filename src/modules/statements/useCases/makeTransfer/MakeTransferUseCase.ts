import { inject } from "tsyringe";
import { AppError } from "../../../../shared/errors/AppError";
import { OperationType } from "../../entities/Statement";
import { IStatementsRepository } from "../../repositories/IStatementsRepository";

interface IRequest {
  amount: number;
  from_user_id: string;
  to_user_id: string;
  description: string;
}

export class MakeTransferUseCase {
  constructor(
    @inject("StatementsRepository")
    private statementsRepository: IStatementsRepository
  ) {}

  async execute({
    amount,
    description,
    from_user_id,
    to_user_id,
  }: IRequest): Promise<void> {
    const fromUser = await this.statementsRepository.getUserBalance({
      user_id: from_user_id,
    });
    const toUser = await this.statementsRepository.getUserBalance({
      user_id: to_user_id,
    });

    if (!fromUser) {
      throw new AppError("From user not found");
    }

    if (!toUser) {
      throw new AppError("To user not found");
    }

    if (fromUser.balance < amount) {
      throw new AppError("Insufficient funds");
    }

    await this.statementsRepository.create({
      user_id: from_user_id,
      amount: -amount,
      description,
      type: "transfer" as OperationType,
    });

    await this.statementsRepository.create({
      user_id: to_user_id,
      amount,
      description,
      type: "transfer" as OperationType,
      sender_id: from_user_id,
    });
  }
}
