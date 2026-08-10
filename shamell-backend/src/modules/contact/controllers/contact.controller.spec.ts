import { Test } from '@nestjs/testing';
import { ContactRequestStatus } from '@prisma/client';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AdminJwtGuard } from '../../../common/auth/guards/admin-jwt.guard';
import {
  makeContactRequestRow,
  makeCreateContactDto,
} from '../__mocks__/contact.fixtures';
import { createContactServiceMock } from '../__mocks__/contact.service.mock';
import { ContactService } from '../services/contact.service';
import { ContactController } from './contact.controller';

describe('ContactController', () => {
  let controller: ContactController;
  const contactService = createContactServiceMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [ContactController],
      providers: [{ provide: ContactService, useValue: contactService }],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleRef.get(ContactController);
  });

  it('create delegates to service', async () => {
    const dto = makeCreateContactDto();
    const row = makeContactRequestRow();
    contactService.create.mockResolvedValue(row);
    await expect(controller.create(dto)).resolves.toEqual(row);
    expect(contactService.create).toHaveBeenCalledWith(dto);
  });

  it('findAll / findOne / badge / peticiones delegate', async () => {
    contactService.findAll.mockResolvedValue({ items: [], meta: {} });
    contactService.findOne.mockResolvedValue(makeContactRequestRow());
    contactService.countPeticionesBadge.mockResolvedValue({ count: 1 });
    contactService.findAllPeticiones.mockResolvedValue({ items: [], meta: {} });

    await controller.findAll({ page: 1, perPage: 10 });
    await controller.findOne('contact-1');
    await controller.countPeticionesBadge({});
    await controller.findAllPeticiones({});

    expect(contactService.findAll).toHaveBeenCalled();
    expect(contactService.findOne).toHaveBeenCalledWith('contact-1');
    expect(contactService.countPeticionesBadge).toHaveBeenCalled();
    expect(contactService.findAllPeticiones).toHaveBeenCalled();
  });

  it('markAsRead / updateStatus / remove delegate', async () => {
    contactService.markAsRead.mockResolvedValue(makeContactRequestRow());
    contactService.updateStatus.mockResolvedValue(makeContactRequestRow());
    contactService.remove.mockResolvedValue(
      makeContactRequestRow({ status: ContactRequestStatus.CANCELLED }),
    );

    await controller.markAsRead('contact-1');
    await controller.updateStatus('contact-1', {
      status: ContactRequestStatus.RESERVED,
    });
    await controller.remove('contact-1');

    expect(contactService.markAsRead).toHaveBeenCalledWith('contact-1');
    expect(contactService.updateStatus).toHaveBeenCalledWith(
      'contact-1',
      ContactRequestStatus.RESERVED,
    );
    expect(contactService.remove).toHaveBeenCalledWith('contact-1');
  });
});
