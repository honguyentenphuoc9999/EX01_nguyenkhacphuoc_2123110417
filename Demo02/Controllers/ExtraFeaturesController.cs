using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Demo02.Data.Repositories;
using Demo02.Models;
using Microsoft.AspNetCore.Authorization;

namespace Demo02.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MinibarLogsController : ControllerBase
    {
        private readonly IUnitOfWork _uow;
        public MinibarLogsController(IUnitOfWork uow) => _uow = uow;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MinibarLog>>> GetMinibarLogs() => Ok(await _uow.MinibarLogs.GetAllAsync(l=>l.Room!, l=>l.Item!));

        [HttpPost]
        public async Task<ActionResult<MinibarLog>> PostMinibarLog(MinibarLog log)
        {
            await _uow.MinibarLogs.AddAsync(log);
            await _uow.CompleteAsync();
            return CreatedAtAction("GetMinibarLogs", new { id = log.LogId }, log);
        }
    }

    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,FrontDesk")]
    public class LoyaltyAccountsController : ControllerBase
    {
        private readonly IUnitOfWork _uow;
        public LoyaltyAccountsController(IUnitOfWork uow) => _uow = uow;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<LoyaltyAccount>>> GetLoyaltyAccounts() => Ok(await _uow.LoyaltyAccounts.GetAllAsync(a=>a.Guest!));

        [HttpPost]
        public async Task<ActionResult<LoyaltyAccount>> PostLoyaltyAccount(LoyaltyAccount acc)
        {
            await _uow.LoyaltyAccounts.AddAsync(acc);
            await _uow.CompleteAsync();
            return CreatedAtAction("GetLoyaltyAccounts", new { id = acc.AccountId }, acc);
        }
    }

    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Accountant")]
    public class RefundsController : ControllerBase
    {
        private readonly IUnitOfWork _uow;
        public RefundsController(IUnitOfWork uow) => _uow = uow;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Refund>>> GetRefunds() => Ok(await _uow.Refunds.GetAllAsync());

        [HttpPost]
        public async Task<ActionResult<Refund>> PostRefund(Refund refund)
        {
            await _uow.Refunds.AddAsync(refund);
            await _uow.CompleteAsync();
            return CreatedAtAction("GetRefunds", new { id = refund.RefundId }, refund);
        }
    }
}
